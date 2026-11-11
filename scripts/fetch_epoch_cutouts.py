"""
Download N epoch cutouts for a target in parallel, saving to disk
plus a manifest.json for downstream flipbook assembly.

Works for time-series case. If only 1 epoch exists, logs a warning
and still produces a single-frame output (frontend handles gracefully).

Run:
  python scripts/fetch_epoch_cutouts.py --ra 133.795129 --dec -7.245147 \
      --size 0.1 --max-frames 20 --out outputs/epoch_frames
"""
import argparse
import io
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlencode

import numpy as np
import requests
from astropy.coordinates import SkyCoord
from astropy.io import fits
from astropy.time import Time
from astropy import units as u
from astroquery.ipac.irsa import Irsa

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--ra", type=float, required=True)
    p.add_argument("--dec", type=float, required=True)
    p.add_argument("--size", type=float, default=0.1)
    p.add_argument("--max-frames", type=int, default=20)
    p.add_argument("--collection", default="spherex_qr2")
    p.add_argument("--out", default="outputs/epoch_frames")
    p.add_argument("--workers", type=int, default=5)
    return p.parse_args()

def download_one(ra, dec, size, mef_url, out_path: Path) -> dict:
    url = f"{mef_url}?{urlencode({'center': f'{ra:.8f},{dec:.8f}', 'size': str(size)})}"
    r = requests.get(url, timeout=90)
    r.raise_for_status()
    out_path.write_bytes(r.content)
    hdul = fits.open(io.BytesIO(r.content))
    try:
        hdr = hdul["IMAGE"].header
        meta = {
            "path": str(out_path),
            "shape": list(hdul["IMAGE"].data.shape),
            "dtype": str(hdul["IMAGE"].data.dtype),
            "mjd_obs": float(hdr.get("MJD-OBS", float("nan"))),
            "mef_url": mef_url,
        }
    finally:
        hdul.close()
    return meta

def main():
    args = parse_args()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    coord = SkyCoord(args.ra, args.dec, unit="deg", frame="icrs")
    print(f"Target: RA={args.ra:.6f}  Dec={args.dec:.6f}  size={args.size}°")

    results = Irsa.query_sia(pos=(coord, 0.05 * u.deg), collection=args.collection)
    print(f"IRSA: {len(results)} MEFs found")
    if len(results) == 0:
        sys.exit("No data at this coordinate.")

    # dedupe by epoch
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

    print(f"Unique epochs: {len(seen)}")

    if len(unique) == 1:
        print("⚠  Only 1 epoch exists — time-series flipbook will be a single frame.")
        print("   Consider spectral flipbook (see WCS-WAVE) as fallback.")

    unique = unique[: args.max_frames]
    print(f"Downloading: {len(unique)} frame(s)")

    tasks = []
    for i, idx in enumerate(unique):
        mjd = float(t_min[idx])
        fname = f"frame_{i:03d}_mjd{mjd:.4f}.fits"
        tasks.append((idx, mjd, urls[idx], out_dir / fname))

    manifest = []
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {
            pool.submit(download_one, args.ra, args.dec, args.size, url, path): (idx, mjd)
            for (idx, mjd, url, path) in tasks
        }
        for fut in as_completed(futures):
            idx, mjd = futures[fut]
            try:
                meta = fut.result()
                meta["epoch_mjd"] = mjd
                meta["epoch_date"] = Time(mjd, format="mjd").to_datetime().isoformat()
                manifest.append(meta)
                print(f"  ✓ idx={idx} mjd={mjd:.4f}")
            except Exception as e:
                print(f"  ✗ idx={idx} failed: {e}")

    manifest.sort(key=lambda m: m["epoch_mjd"])
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"\nSaved {len(manifest)} frames + manifest.json → {out_dir}/")

if __name__ == "__main__":
    main()