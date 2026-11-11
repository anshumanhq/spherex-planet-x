"""
Decode SPHEREx FLAGS bitmask to understand which bits are set.
Prints bit-wise breakdown, distinct values, spatial distribution,
and a strict-bad estimate (ignoring benign bits).

Run: python scripts/decode_flags.py
"""
import sys
from pathlib import Path

import numpy as np
from astropy.io import fits

# Locate cutout — CI saves under outputs/, local may differ
candidates = [
    Path("outputs/spherex_cutout_wise0855.fits"),
    Path("spherex_cutout_wise0855.fits"),
]
fits_path = next((p for p in candidates if p.exists()), None)
if fits_path is None:
    sys.exit("No cutout FITS found. Run the pipeline test first.")

print(f"Reading: {fits_path}\n")

with fits.open(fits_path) as hdul:
    flags = hdul["FLAGS"].data.astype(np.int32)

total = flags.size
n_nonzero = int(np.sum(flags != 0))

print(f"Total pixels: {total}")
print(f"Non-zero flags: {n_nonzero} ({n_nonzero/total*100:.1f}%)\n")

# ---- Bit-wise breakdown ----
print("Bit-wise breakdown:")
print("-" * 55)
for bit in range(16):
    mask = 1 << bit
    n_set = int(np.sum((flags & mask) != 0))
    if n_set > 0:
        print(f"  bit {bit:2d} (0x{mask:04x}): {n_set:5d} pixels ({n_set/total*100:5.1f}%)")

# ---- Distinct values ----
print("\nDistinct FLAGS values (top 10):")
unique, counts = np.unique(flags, return_counts=True)
order = np.argsort(-counts)
for i in order[:10]:
    val, cnt = int(unique[i]), int(counts[i])
    print(f"  FLAGS={val:5d} (0b{val:016b}): {cnt:5d} pixels ({cnt/total*100:5.1f}%)")

# ---- Spatial distribution ----
print("\nSpatial distribution of non-zero flags:")
ny, nx = flags.shape
edge_mask = np.zeros_like(flags, dtype=bool)
edge_mask[0, :] = edge_mask[-1, :] = True
edge_mask[:, 0] = edge_mask[:, -1] = True
interior_mask = ~edge_mask

n_edge = int(np.sum((flags != 0) & edge_mask))
n_int = int(np.sum((flags != 0) & interior_mask))
n_edge_tot = int(edge_mask.sum())
n_int_tot = int(interior_mask.sum())

print(f"  Edge    : {n_edge:5d}/{n_edge_tot:5d} ({n_edge/n_edge_tot*100:5.1f}%)")
print(f"  Interior: {n_int:5d}/{n_int_tot:5d} ({n_int/n_int_tot*100:5.1f}%)")

# ---- Strict-bad estimate (assumes bits 0-2 are benign coverage/detection) ----
BENIGN_MASK = 0b0000000000000111
STRICT_MASK = ~BENIGN_MASK & 0xFFFF
n_strict = int(np.sum((flags & STRICT_MASK) != 0))
print(f"\nStrict-bad (bits 3+): {n_strict}/{total} "
      f"({n_strict/total*100:.1f}%)")
print("\nNote: benign-bit assumption must be verified against SPHEREx docs.")