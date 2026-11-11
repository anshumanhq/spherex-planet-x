"""
Assemble frames from a manifest.json into an animated WebP (and optional GIF).
Reads FITS files, normalizes each to 5-95 percentiles, stacks, exports.

Run:
  python scripts/assemble_flipbook.py --manifest outputs/epoch_frames/manifest.json \
      --fps 4 --out outputs/flipbook.webp
"""
import argparse
import json
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--manifest", required=True)
    p.add_argument("--fps", type=float, default=4.0)
    p.add_argument("--out", default="outputs/flipbook.webp")
    p.add_argument("--also-gif", action="store_true",
                   help="Also export a .gif next to the .webp")
    return p.parse_args()

def load_normalized(path: str) -> np.ndarray:
    hdul = fits.open(path)
    try:
        img = hdul["IMAGE"].data.astype(float)
    finally:
        hdul.close()
    finite = img[np.isfinite(img)]
    if finite.size == 0:
        return np.zeros(img.shape, dtype=np.uint8)
    vmin, vmax = np.percentile(finite, [5, 95])
    norm = np.clip((img - vmin) / max(vmax - vmin, 1e-12), 0, 1)
    norm[~np.isfinite(norm)] = 0
    # flipud for correct orientation (FITS origin=lower)
    return (np.flipud(norm) * 255).astype(np.uint8)

def main():
    args = parse_args()
    manifest = json.loads(Path(args.manifest).read_text())
    if not manifest:
        raise SystemExit("Empty manifest — nothing to render.")

    print(f"Frames in manifest: {len(manifest)}")

    # Load all frames (pad to common shape if needed)
    frames = []
    target_shape = None
    for entry in manifest:
        arr = load_normalized(entry["path"])
        if target_shape is None:
            target_shape = arr.shape
        elif arr.shape != target_shape:
            # pad/crop to match the first frame
            ny, nx = target_shape
            out = np.zeros(target_shape, dtype=np.uint8)
            h = min(ny, arr.shape[0])
            w = min(nx, arr.shape[1])
            out[:h, :w] = arr[:h, :w]
            arr = out
        frames.append(arr)

    print(f"Frame shape: {target_shape}")
    duration_ms = int(1000 / args.fps)

    pil_frames = [Image.fromarray(f, mode="L") for f in frames]

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Animated WebP
    pil_frames[0].save(
        out_path,
        save_all=True,
        append_images=pil_frames[1:],
        duration=duration_ms,
        loop=0,
        format="WEBP",
        quality=85,
    )
    print(f"Saved WebP: {out_path} ({out_path.stat().st_size/1024:.1f} KB)")

    # Optional GIF
    if args.also_gif:
        gif_path = out_path.with_suffix(".gif")
        pil_frames[0].save(
            gif_path,
            save_all=True,
            append_images=pil_frames[1:],
            duration=duration_ms,
            loop=0,
            format="GIF",
        )
        print(f"Saved GIF:  {gif_path} ({gif_path.stat().st_size/1024:.1f} KB)")

if __name__ == "__main__":
    main()