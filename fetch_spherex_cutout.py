"""
Fetch a small SPHEREx cutout around WISE 0855 for pipeline testing.
Run: python fetch_spherex_cutout.py
"""

import numpy as np
import matplotlib.pyplot as plt
from astropy.io import fits
from astropy.wcs import WCS
from astropy.coordinates import SkyCoord
from astropy import units as u
from astroquery.ipac.irsa import Irsa
from urllib.parse import urlencode

# ------------------------------------------------------------
# Target: WISE 0855
# ------------------------------------------------------------
coord = SkyCoord("08h55m10.831s", "-07d14m42.53s", frame="icrs")
print(f"Target: RA={coord.ra.deg:.6f} deg, Dec={coord.dec.deg:.6f} deg")

# Start with a small radius; increase if nothing is found
search_radius = 0.05 * u.deg   # 3 arcmin

# ------------------------------------------------------------
# Query IRSA SIA for SPHEREx Spectral Image MEFs
# Try QR3 first (latest), then fall back to QR2
# ------------------------------------------------------------
results = None
for collection in ["spherex_qr3", "spherex_qr2"]:
    print(f"\nQuerying collection: {collection}")
    try:
        res = Irsa.query_sia(pos=(coord, search_radius), collection=collection)
        print(f"  → {len(res)} result(s)")
        if len(res) > 0:
            results = res
            print(f"  Using collection: {collection}")
            break
    except Exception as exc:
        print(f"  → Query failed: {exc}")

if results is None:
    raise RuntimeError(
        "No SPHEREx MEFs found. Try increasing search_radius to 0.1 or 0.2 deg."
    )

# Show what came back
print("\nAvailable columns:")
print(results.colnames)

print("\nFirst result — key columns:")
for col in ["access_url", "obs_collection", "dataproduct_type", "t_min", "t_max"]:
    if col in results.colnames:
        print(f"  {col}: {results[0][col]}")

# ------------------------------------------------------------
# Build cutout URL and download a small FITS file
# ------------------------------------------------------------
full_url = results["access_url"][0]
print(f"\nFull MEF URL (large):\n  {full_url}")

center_str = f"{coord.ra.deg:.8f},{coord.dec.deg:.8f}"
cutout_url = f"{full_url}?{urlencode({'center': center_str, 'size': '0.1'})}"
print(f"\nCutout URL:\n  {cutout_url}")

print("\nDownloading cutout …")
hdul = fits.open(cutout_url)

# Inspect HDUs
hdul.info()

# Confirm key extensions and shapes
print("\nKey extension shapes:")
for hdu in hdul:
    if hdu.data is not None and hdu.name.upper() in {"IMAGE", "FLAGS", "VARIANCE", "ZODI"}:
        print(f"  {hdu.name}: shape={hdu.data.shape}, dtype={hdu.data.dtype}")

# Save locally for later steps
hdul.writeto("spherex_cutout_wise0855.fits", overwrite=True)
print("\nSaved: spherex_cutout_wise0855.fits")