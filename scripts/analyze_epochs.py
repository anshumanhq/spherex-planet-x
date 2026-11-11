"""
Analyze SPHEREx epochs around WISE 0855 to check flipbook feasibility.

Answers:
  - How many unique calendar dates (epochs) have coverage?
  - How many MEFs per epoch (overlapping footprints)?
  - Time span and cadence?
  - Is a time-series flipbook feasible, or should we pivot to spectral?

Run: python scripts/analyze_epochs.py
"""
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from astropy.coordinates import SkyCoord
from astropy import units as u
from astropy.time import Time
from astroquery.ipac.irsa import Irsa

OUT = Path("outputs")
OUT.mkdir(exist_ok=True)
LOG = []

def log(msg=""):
    print(msg)
    LOG.append(str(msg))

coord = SkyCoord("08h55m10.831s", "-07d14m42.53s", frame="icrs")
log(f"Target: WISE 0855  RA={coord.ra.deg:.4f}  Dec={coord.dec.deg:.4f}\n")

# ---- Query IRSA ----
results = None
used = None
for collection in ["spherex_qr3", "spherex_qr2"]:
    try:
        res = Irsa.query_sia(pos=(coord, 0.05 * u.deg), collection=collection)
        log(f"{collection}: {len(res)} results")
        if len(res) > 0 and results is None:
            results, used = res, collection
    except Exception as e:
        log(f"{collection}: error — {e}")

if results is None:
    sys.exit("No SPHEREx data found.")

log(f"\nUsing collection: {used}  ({len(results)} MEFs)\n")

# ---- Time analysis ----
t_min = np.array(results["t_min"], dtype=float)
t_max = np.array(results["t_max"], dtype=float)
urls = list(results["access_url"])

def mjd_to_date(mjd):
    return Time(mjd, format="mjd").to_datetime().date()

dates = [mjd_to_date(t) for t in t_min]
unique_dates = sorted(set(dates))
durations_sec = (t_max - t_min) * 86400.0

log("=== TIME ANALYSIS ===")
log(f"Time span: {mjd_to_date(t_min.min())} → {mjd_to_date(t_max.max())}")
log(f"Total span: {(t_max.max() - t_min.min()):.2f} days")
log(f"Unique calendar dates: {len(unique_dates)}")
if unique_dates:
    log(f"First dates: {unique_dates[:10]}")
    log(f"Last dates:  {unique_dates[-10:]}")

log(f"\nMEFs per date:")
by_date = Counter(dates)
for d in unique_dates:
    log(f"  {d}: {by_date[d]} MEFs")

log(f"\nExposure duration (t_max - t_min):")
log(f"  min={durations_sec.min():.1f}s  "
    f"median={np.median(durations_sec):.1f}s  "
    f"max={durations_sec.max():.1f}s")

# ---- Spectral info (are MEFs dithered, or multi-band?) ----
log("\n=== SPECTRAL / BAND INFO ===")
if "em_min" in results.colnames:
    em_min = np.array(results["em_min"], dtype=float)
    em_max = np.array(results["em_max"], dtype=float)
    log(f"em_min: {em_min.min():.3f} → {em_min.max():.3f} μm")
    log(f"em_max: {em_max.min():.3f} → {em_max.max():.3f} μm")
    log(f"Unique (em_min, em_max) pairs: "
        f"{len(set(zip(np.round(em_min,3), np.round(em_max,3))))}")

if "em_res_power" in results.colnames:
    rp = np.array(results["em_res_power"], dtype=float)
    log(f"em_res_power: {rp.min():.0f} → {rp.max():.0f}")

# ---- Pointing spread (are footprints dithered?) ----
log("\n=== POINTING SPREAD ===")
if "s_ra" in results.colnames and "s_dec" in results.colnames:
    s_ra = np.array(results["s_ra"], dtype=float)
    s_dec = np.array(results["s_dec"], dtype=float)
    log(f"s_ra  spread:  {s_ra.min():.4f} → {s_ra.max():.4f} deg "
        f"(range {(s_ra.max()-s_ra.min())*3600:.1f} arcsec)")
    log(f"s_dec spread:  {s_dec.min():.4f} → {s_dec.max():.4f} deg "
        f"(range {(s_dec.max()-s_dec.min())*3600:.1f} arcsec)")

# ---- Weeks covered (from filename tokens like 2025W44) ----
log("\n=== WEEKS COVERED (from filenames) ===")
weeks = Counter()
for url in urls:
    for token in Path(str(url)).name.split("_"):
        if len(token) >= 6 and token[4] == "W" and token[:4].isdigit():
            weeks[token] += 1
            break
for w, c in sorted(weeks.items()):
    log(f"  {w}: {c} MEFs")

# ---- Sample filenames ----
log("\n=== SAMPLE FILENAMES ===")
for i in range(min(5, len(urls))):
    log(f"  {i}: {Path(str(urls[i])).name}")

# ---- Verdict ----
log("\n=== FLIPBOOK FEASIBILITY VERDICT ===")
n_dates = len(unique_dates)
if n_dates >= 10:
    log(f"✅ TIME-SERIES FLIPBOOK: {n_dates} epochs available "
        f"(viable, build it)")
elif n_dates >= 3:
    log(f"⚠️  LIMITED TIME-SERIES: {n_dates} epochs "
        f"(flipbook possible but sparse)")
else:
    log(f"❌ NO TIME-SERIES: {n_dates} epoch(s) only")
    log("   → Pivot to SPECTRAL flipbook: iterate over 102 wavelength channels")
    log("   → Same MEF, sweep WCS-WAVE table, render frame per channel")

# ---- Save ----
out_path = OUT / "epoch_analysis.txt"
out_path.write_text("\n".join(LOG), encoding="utf-8")
log(f"\nSaved: {out_path}")