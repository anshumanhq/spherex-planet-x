# Architecture

Technical deep-dive into SPHEREx Planet X.

---

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (localhost:5173)              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  LiveDataPanel.tsx                               │   │
│  │  - RA/Dec input                                  │   │
│  │  - Fetch button                                  │   │
│  │  - Flipbook viewer (image swap)                  │   │
│  │  - Play/pause controls                           │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↓ POST /api/cutouts/frames     │
│                     (Vite proxy)                        │
└─────────────────────────┬───────────────────────────────┘
                          ↓
┌─────────────────────────┴───────────────────────────────┐
│                 FastAPI Backend (:8000)                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  app/main.py                                     │   │
│  │  1. Irsa.query_sia(pos, collection)             │   │
│  │  2. Deduplicate by epoch                        │   │
│  │  3. Spread selection (N frames over time)       │   │
│  │  4. Parallel cutout download (3 workers)        │   │
│  │  5. FITS parse → IMAGE HDU                      │   │
│  │  6. Percentile normalize → WebP                 │   │
│  │  7. Save to static/frames/                      │   │
│  │  8. Return JSON with frame URLs                 │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          ↓
┌─────────────────────────┴───────────────────────────────┐
│                   NASA IRSA (Remote)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  SIA Service                                     │   │
│  │  → List of MEFs with t_min, access_url          │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Cutout Service                                  │   │
│  │  → Spatial crop of IMAGE, FLAGS, VARIANCE, PSF  │   │
│  │  → ~5 MB FITS per cutout                        │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow Details

### Query Phase

```python
results = Irsa.query_sia(pos=(coord, 0.05 * u.deg), collection="spherex_qr2")
```

Returns `astropy.table.Table` with columns:
- `access_url` — MEF download URL
- `t_min` — observation start (MJD)
- `t_max` — observation end (MJD)
- `s_ra`, `s_dec` — spatial center
- `em_min`, `em_max` — wavelength coverage

For WISE 0855: **278 rows** (each MEF is one HDU at one pointing).

### Deduplication

Many MEFs share the same `t_min` (overlapping footprints during a scan). Backend rounds to 1 second:

```python
t_min = np.array(results["t_min"], dtype=float)
seen = set()
unique_indices = []
for i in np.argsort(t_min):
    key = round(t_min[i], 4)
    if key not in seen:
        seen.add(key)
        unique_indices.append(i)
```

Result: **142 unique epochs** from 278 MEFs.

### Spread Selection

Take N frames evenly across time range (not the earliest N):

```python
if len(unique_indices) > n_frames:
    step = len(unique_indices) / n_frames
    picks = sorted({min(int(round(i * step)), len(unique_indices) - 1)
                    for i in range(n_frames)})
    selected = [unique_indices[p] for p in picks]
```

For 142 epochs → 5 frames: picks indices at 0, 28, 57, 85, 113.
Span = **364 days** (May 2025 → May 2026).

### Cutout URL Construction

```
{access_url}?center={ra},{dec}&size=0.1
```

IRSA returns a spatially cropped FITS with all HDUs intact.

### Parallel Download

```python
with ThreadPoolExecutor(max_workers=3) as pool:
    futures = {pool.submit(fetch_and_render, i) for i in selected}
```

**Why 3 workers?**
- 5+ workers triggers IRSA 503 rate limit
- 3 is stable for repeated fetches

### FITS Parse + Normalize

```python
hdul = fits.open(cutout_bytes)
image = hdul["IMAGE"].data.astype(float)
finite = image[np.isfinite(image)]
vmin, vmax = np.percentile(finite, [5, 95])
norm = np.clip((image - vmin) / (vmax - vmin), 0, 1)
norm[~np.isfinite(norm)] = 0
data_uint8 = (norm * 255).astype(np.uint8)
Image.fromarray(np.flipud(data_uint8), mode="L").save(webp_path, "WEBP", quality=85)
```

- **5-95 percentile** stretch: robust to outliers (cosmic rays, hot pixels)
- **flipud**: FITS origin is bottom-left; PNG/WebP origin is top-left
- **WebP quality 85**: ~20 KB per frame at 59×59

### Cache Behavior

```python
webp_path = FRAME_DIR / f"{frame_id}.webp"
if not webp_path.exists():
    fetch_and_render(...)
```

Cache persists across backend restarts. Files in `static/frames/`.

---

## Data Quality Considerations

### FLAGS bitmask

Decoded from sample cutout (`scripts/decode_flags.py`):

| Bit | Fraction set | Interpretation |
|---|---|---|
| 21 | 28.8% | Benign coverage / detection flag |
| 19 | 2.3% | Minor coverage |
| 17 | 0.1% | Edge |
| 0, 2, 11 | <1% | Minor |

**Strict-bad (bits 3+ excluding benign)**: 0.00% — data is clean.

Naive `FLAGS != 0` counts benign coverage as "bad" (31.4% flagged). Backend uses bitmask-aware check instead.

### WCS Validation

```python
wcs = WCS(hdul["IMAGE"].header)
assert wcs.has_celestial  # passes for all cutouts
```

Celestial coordinates present — usable for alignment or overlay work.

### VARIANCE

Typical values: median 8.4e-4 MJy²/sr². Physically reasonable.

---

## Extension Sizes in Cutout

For a 0.1° cutout (~59×59 pixels):

| Extension | Shape | Size | Purpose |
|---|---|---|---|
| IMAGE | 59×59 | 14 KB | Science data (float32) |
| FLAGS | 59×59 | 14 KB | Bitmask (int32) |
| VARIANCE | 59×59 | 14 KB | Per-pixel variance |
| ZODI | 59×59 | 14 KB | Zodiacal light model |
| **PSF** | 101×101×121 | **4.9 MB** | Point spread function |
| WCS-WAVE | table | tiny | Wavelength solution |

**PSF is 99% of file size.** IRSA cutout service does not support HDU filtering (`hdu=1` parameter is ignored). Full 5 MB download is unavoidable.

**Implication**: For 10 frames = 50 MB from IRSA. First fetch slow (90-180 s). Solution: cache.

---

## Rate Limiting & Retry Strategy

### The 503 problem

IRSA enforces per-IP rate limits. Aggressive parallel download → 503 Service Unavailable.

**Symptoms**:
- Some frames download, others fail
- 5+ workers → 30-50% failure rate
- 3 workers → <5% failure rate

### Retry implementation

```python
for attempt in range(retries):
    try:
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        return r.content
    except requests.HTTPError as e:
        if e.response.status_code in (429, 500, 502, 503, 504):
            wait = 3 * (2 ** attempt)  # 3s, 6s, 12s
            time.sleep(wait)
            continue
        raise
```

**Combined with**:
- 3 parallel workers (not 5+)
- Disk cache (never refetch successful frames)
- Cutout service (not full MEF download — 14× less data)

**Net result**: >95% success rate on cache misses.

---

## Frontend Rendering

### Why WebP?

- **Size**: 20 KB vs 15 KB PNG (better with animation)
- **Quality**: better than JPEG at same size for grayscale
- **Browser support**: universal (2024+)

### Frame swap strategy

```tsx
<img src={data.frames[frameIdx].image_url} />
```

Only current frame is loaded. Browser caches previous ones automatically.

### Playback

```tsx
useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => {
        setFrameIdx(i => (i + 1) % data.frames.length)
    }, 600)
    return () => clearInterval(timer)
}, [playing, data])
```

600 ms per frame = ~1.7 FPS (comfortable for human perception).

---

## CI Pipeline

`.github/workflows/spherex-test.yml` runs on every push/PR:

```yaml
name: SPHEREx Pipeline Test
on: [push, pull_request]

jobs:
  test-pipeline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11', cache: 'pip' }
      - run: pip install -r requirements.txt
      - run: python scripts/spherex_pipeline_test.py
      - run: python scripts/decode_flags.py
      - run: python scripts/analyze_epochs.py
      - uses: actions/upload-artifact@v4
        with:
          name: spherex-artifacts
          path: outputs/
```

**Each step catches a different class of bug**:
- Pipeline test → IRSA access, FITS structure, WCS validity
- FLAGS decode → bitmask parsing, dtype overflow (caught int32 bug)
- Epoch analysis → date range, deduplication logic

**Artifacts** uploaded on every run — download to inspect FITS, plots, logs.

---

## Deployment (Planned)

### Render (Blueprint)

```yaml
services:
  - type: web
    name: spherex-planet-x-api
    runtime: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
    healthCheckPath: /health
```

### Frontend (Vercel / Netlify / Static)

Build: `npm run build` → static files in `dist/`
Configure `VITE_API_URL` env to point to Render backend URL.

### Caching layer (post-hackathon)

Current: disk cache in `static/frames/` (per-instance, lost on redeploy).
Future: Redis cache shared across instances.

---

## Future Extensions

| Feature | Complexity | Value |
|---|---|---|
| Spectral flipbook (102 channels per epoch) | Medium | High (unique to SPHEREx) |
| Aladin Lite sky overlay | Medium | Medium (context) |
| Multi-target comparison | Low | Medium |
| Gemini AI explanations per epoch | Low | High (differentiator) |
| Redis cache + background sync | Medium | High (performance) |
| User-submitted targets (auth) | High | Low (post-MVP) |

---

## Key Files Reference

| File | Purpose |
|---|---|
| `app/main.py` | FastAPI server, both endpoints |
| `src/components/LiveDataPanel.tsx` | Working frontend integration |
| `src/main.tsx` | Standalone entry point |
| `vite.config.ts` | Dev proxy for `/api` and `/static` |
| `scripts/spherex_pipeline_test.py` | End-to-end CI test |
| `scripts/decode_flags.py` | FLAGS bitmask analysis |
| `scripts/analyze_epochs.py` | Epoch feasibility report |
| `.github/workflows/spherex-test.yml` | CI pipeline |
| `requirements.txt` | Python deps |
| `package.json` | Node deps |