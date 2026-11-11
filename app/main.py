"""
SPHEREx Planet X — FastAPI backend.

Endpoints:
  GET  /health
  POST /api/cutouts/frames   → flipbook frames as WebP URLs

Run locally:
  uvicorn app.main:app --reload --port 8000
  → http://localhost:8000/docs
"""
import io
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode

import numpy as np
import requests
from astropy.coordinates import SkyCoord
from astropy.io import fits
from astropy.time import Time
from astropy import units as u
from astroquery.ipac.irsa import Irsa
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from PIL import Image

# ------------------------------------------------------------
# Setup
# ------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
FRAME_DIR = BASE_DIR / "static" / "frames"
FRAME_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="SPHEREx Planet X API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # MVP — tighten for prod
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

# ------------------------------------------------------------
# Schemas
# ------------------------------------------------------------
class FrameRequest(BaseModel):
    ra: float = Field(..., ge=0, lt=360, description="Right Ascension (deg)")
    dec: float = Field(..., ge=-90, le=90, description="Declination (deg)")
    size_deg: float = Field(0.1, gt=0, le=1.0, description="Cutout size (deg)")
    n_frames: int = Field(10, ge=1, le=50, description="Max frames to return")
    collection: str = Field("spherex_qr2", description="IRSA collection")

class Frame(BaseModel):
    frame_index: int
    epoch_mjd: float
    epoch_date: str
    image_url: str
    mef_url: str

class FramesResponse(BaseModel):
    ra: float
    dec: float
    collection: str
    total_found: int
    returned_frames: int
    frames: list[Frame]
    meta: dict

# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------
def render_webp(image_2d: np.ndarray, out_path: Path) -> None:
    """FITS IMAGE → normalized grayscale WebP (colormap applied client-side)."""
    finite = image_2d[np.isfinite(image_2d)]
    if finite.size == 0:
        data = np.zeros_like(image_2d, dtype=np.uint8)
    else:
        vmin, vmax = np.percentile(finite, [5, 95])
        norm = np.clip((image_2d - vmin) / max(vmax - vmin, 1e-12), 0, 1)
        norm[~np.isfinite(norm)] = 0
        data = (norm * 255).astype(np.uint8)
    Image.fromarray(np.flipud(data), mode="L").save(out_path, "WEBP", quality=85)

def fetch_and_render(ra: float, dec: float, mef_url: str,
                     size_deg: float, out_path: Path) -> None:
    cutout_url = (
        f"{mef_url}?{urlencode({'center': f'{ra:.8f},{dec:.8f}', 'size': str(size_deg)})}"
    )
    resp = requests.get(cutout_url, timeout=60)
    resp.raise_for_status()
    hdul = fits.open(io.BytesIO(resp.content))
    try:
        render_webp(hdul["IMAGE"].data, out_path)
    finally:
        hdul.close()

# ------------------------------------------------------------
# Routes
# ------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}

@app.post("/api/cutouts/frames", response_model=FramesResponse)
def cutouts_frames(req: FrameRequest):
    coord = SkyCoord(req.ra, req.dec, unit="deg", frame="icrs")

    # 1. Query IRSA
    try:
        results = Irsa.query_sia(pos=(coord, 0.05 * u.deg), collection=req.collection)
    except Exception as e:
        raise HTTPException(502, f"IRSA query failed: {e}")

    if len(results) == 0:
        raise HTTPException(404, f"No SPHEREx data at RA={req.ra}, Dec={req.dec}")

    # 2. Dedupe by epoch (round to ~1 sec)
    t_min = np.array(results["t_min"], dtype=float)
    urls = list(results["access_url"])
    order = np.argsort(t_min)
    seen, unique = set(), []
    for i in order:
        key = round(t_min[i], 4)
        if key in seen:
            continue
        seen.add(key)
        unique.append(i)
    unique = unique[: req.n_frames]

    # 3. Parallel download + render
    def job(idx: int) -> Frame:
        mjd = float(t_min[idx])
        tag = f"{req.ra:.4f}_{req.dec:.4f}_{mjd:.4f}".replace(".", "p").replace("-", "m")
        webp_path = FRAME_DIR / f"{tag}.webp"
        if not webp_path.exists():
            fetch_and_render(req.ra, req.dec, str(urls[idx]), req.size_deg, webp_path)
        return Frame(
            frame_index=idx,
            epoch_mjd=mjd,
            epoch_date=Time(mjd, format="mjd").to_datetime().isoformat(),
            image_url=f"/static/frames/{webp_path.name}",
            mef_url=str(urls[idx]),
        )

    frames: list[Frame] = []
    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = {pool.submit(job, i): i for i in unique}
        for fut in as_completed(futures):
            try:
                frames.append(fut.result())
            except Exception as e:
                # skip failed frame, keep others
                print(f"frame failed: {e}")

    if not frames:
        raise HTTPException(500, "All frame downloads failed")

    frames.sort(key=lambda f: f.epoch_mjd)
    ep = [f.epoch_mjd for f in frames]
    cadence_h = float(np.median(np.diff(ep))) * 24.0 if len(ep) > 1 else None

    return FramesResponse(
        ra=req.ra,
        dec=req.dec,
        collection=req.collection,
        total_found=len(results),
        returned_frames=len(frames),
        frames=frames,
        meta={
            "size_deg": req.size_deg,
            "cadence_hours": cadence_h,
            "unique_epochs": len(seen),
        },
    )