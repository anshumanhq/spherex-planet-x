"""
Full SPHEREx pipeline test — Step 2 through Step 7 of the plan.
Runs in GitHub Actions CI. Saves all results to ./outputs/
"""
import os
from pathlib import Path
from urllib.parse import urlencode

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from astropy.io import fits
from astropy.wcs import WCS
from astropy.coordinates import SkyCoord
from astropy import units as u
from astroquery.ipac.irsa import Irsa

OUT = Path("outputs"); OUT.mkdir(exist_ok=True)
LOG = []
def log(msg=""):
    print(msg); LOG.append(str(msg))

def summary(md):
    """Write to GitHub Actions step summary (visible in UI, no download)."""
    p = os.environ.get("GITHUB_STEP_SUMMARY")
    if p:
        with open(p, "a", encoding="utf-8") as f:
            f.write(md + "\n")

# ---------------- Step 2: Query IRSA ----------------
coord = SkyCoord("08h55m10.831s", "-07d14m42.53s", frame="icrs")
log(f"Target: WISE 0855  RA={coord.ra.deg:.6f}  Dec={coord.dec.deg:.6f}")

log("\n=== Step 2: SIA query ===")
results = None
used = None
for collection in ["spherex_qr3", "spherex_qr2"]:
    log(f"Trying collection={collection}")
    try:
        res = Irsa.query_sia(pos=(coord, 0.05 * u.deg), collection=collection)
        log(f"  results: {len(res)}")
        if len(res) > 0:
            results, used = res, collection
            break
    except Exception as e:
        log(f"  error: {e}")

assert results is not None, "No SPHEREx data found — increase search radius."
log(f"Using collection: {used}")

# ---------------- Step 3: Cutout URL + download ----------------
full_url = results["access_url"][0]
center = f"{coord.ra.deg:.8f},{coord.dec.deg:.8f}"
cutout_url = f"{full_url}?{urlencode({'center': center, 'size': '0.1'})}"
log(f"\n=== Step 3: Download cutout ===\n{cutout_url}")

hdul = fits.open(cutout_url)
cutout_path = OUT / "spherex_cutout_wise0855.fits"
hdul.writeto(cutout_path, overwrite=True)
log(f"Saved: {cutout_path}  ({cutout_path.stat().st_size/1024:.1f} KB)")

# ---------------- Step 4: Inspect HDUs ----------------
log("\n=== Step 4: HDU inspection ===")
hdu_names = [h.name for h in hdul]
log(f"HDUs: {hdu_names}")

required = {"IMAGE", "FLAGS", "VARIANCE"}
present  = required & set(hdu_names)
log(f"Required present: {present}")
assert present == required, f"Missing: {required - present}"

image = hdul["IMAGE"].data
flags = hdul["FLAGS"].data
var   = hdul["VARIANCE"].data
log(f"IMAGE shape={image.shape} dtype={image.dtype}")
log(f"FLAGS shape={flags.shape} dtype={flags.dtype}")
log(f"VARIANCE shape={var.shape} dtype={var.dtype}")

# ---------------- Step 5: Visualize IMAGE ----------------
log("\n=== Step 5: Visualization ===")
wcs = WCS(hdul["IMAGE"].header)
has_wcs = wcs.has_celestial
log(f"WCS celestial present: {has_wcs}")

fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))

# Left: IMAGE with percentiles
vmin, vmax = np.nanpercentile(image, [5, 95])
im0 = axes[0].imshow(image, origin="lower", cmap="inferno", vmin=vmin, vmax=vmax)
axes[0].set_title(f"SPHEREx IMAGE ({image.shape[0]}×{image.shape[1]})")
plt.colorbar(im0, ax=axes[0], label="MJy/sr")

# Right: FLAGS map
im1 = axes[1].imshow(flags, origin="lower", cmap="viridis")
axes[1].set_title("FLAGS")
plt.colorbar(im1, ax=axes[1], label="bitmask")

plt.tight_layout()
plot_path = OUT / "spherex_cutout_plot.png"
plt.savefig(plot_path, dpi=120, bbox_inches="tight")
log(f"Saved plot: {plot_path}")

# ---------------- Step 6: Data quality ----------------
log("\n=== Step 6: Data quality checks ===")
n_bad_flags = int(np.sum(flags != 0))
frac_bad = n_bad_flags / flags.size
log(f"Bad-flag pixels: {n_bad_flags}/{flags.size} ({frac_bad*100:.2f}%)")

finite_var = var[np.isfinite(var)]
if finite_var.size:
    log(f"VARIANCE: min={finite_var.min():.3e}  median={np.median(finite_var):.3e}  max={finite_var.max():.3e}")
else:
    log("VARIANCE: all non-finite (WARNING)")

finite_img = image[np.isfinite(image)]
if finite_img.size:
    log(f"IMAGE valid pixels: {finite_img.size}/{image.size} ({finite_img.size/image.size*100:.1f}%)")

# Quality verdict
ok = (has_wcs and frac_bad < 0.20 and finite_var.size > 0 and finite_img.size > 0)
verdict = "PASS ✅" if ok else "REVIEW ⚠️"
log(f"\nVerdict: {verdict}")

# ---------------- Step 7: Report ----------------
(OUT / "pipeline_log.txt").write_text("\n".join(LOG), encoding="utf-8")

summary(f"""
## SPHEREx Pipeline Test — {verdict}

| Check | Value |
|---|---|
| Collection used | `{used}` |
| HDUs found | `{', '.join(hdu_names)}` |
| IMAGE shape | `{image.shape}` |
| Bad-flag pixels | `{n_bad_flags}/{flags.size}` ({frac_bad*100:.1f}%) |
| WCS present | `{has_wcs}` |
| Cutout size | `{cutout_path.stat().st_size/1024:.1f} KB` |

**Artifacts:** `spherex-cutout-fits`, `spherex-plots`, `pipeline-log`
""")

if not ok:
    raise SystemExit("Quality checks failed — see log.")
log("\nAll checks passed.")