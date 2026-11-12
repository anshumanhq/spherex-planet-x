# Architecture

Technical deep-dive into SPHEREx Planet X.

---

## System Overview

```
┌──────────────────────────────────────────────────────────┐
│             Browser (React SPA on Render)                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Header (share button → modal)                      │  │
│  │  LiveDataPanel                                      │  │
│  │    - RA/Dec input, FETCH button                     │  │
│  │    - Flipbook viewer + play/pause                   │  │
│  │    - Real quality stats from API                    │  │
│  │    - AI Insight (typewriter)                        │  │
│  │    - AI Chat (multi-turn)                           │  │
│  │  Design Vision (mockup)                             │  │
│  │    - Interactive canvas (4 modes)                   │  │
│  │    - SED chart, band selector, overlays             │  │
│  │    - Discovery log + CSV export                     │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────────────────┘
                   ↓ HTTPS
┌──────────────────┴───────────────────────────────────────┐
│         FastAPI Backend (Render, Python 3.11)            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  /api/cutouts/frames   → IRSA → WebP pipeline      │  │
│  │  /api/explain          → OpenRouter/Gemini         │  │
│  │  /api/chat             → OpenRouter/Gemini         │  │
│  │  /static/frames/*.webp → disk cache                │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────────────────┘
                   ↓
     ┌─────────────┴──────────────┐
     ↓                            ↓
┌──────────────┐          ┌────────────────────┐
│ NASA IRSA    │          │ OpenRouter         │
│  SIA +       │          │  → Gemini Flash    │
│  Cutout svc  │          │  → Nemotron        │
└──────────────┘          │  → Llama           │
                          └────────────────────┘
```

---

## Data Flow — Flipbook

### Query Phase

```python
results = Irsa.query_sia(pos=(coord, 0.05 * u.deg), collection="spherex_qr2")
```

Returns `astropy.table.Table` with:
- `access_url` — MEF URL
- `t_min`, `t_max` — observation times (MJD)
- `s_ra`, `s_dec` — spatial center
- `em_min`, `em_max` — wavelength range

For WISE 0855: **278 rows**.

### Deduplication

Many MEFs share `t_min` (overlapping footprints during scan):

```python
t_min = np.array(results["t_min"], dtype=float)
seen, unique = set(), []
for i in np.argsort(t_min):
    key = round(t_min[i], 4)
    if key in seen: continue
    seen.add(key)
    unique.append(i)
```

**142 unique epochs** from 278 MEFs.

### Spread Selection

Take N frames evenly across time range:

```python
if len(unique) > n_frames:
    step = len(unique) / n_frames
    picks = sorted({min(int(round(i * step)), len(unique) - 1)
                    for i in range(n_frames)})
    selected = [unique[p] for p in picks]
```

For 142 epochs → 5 frames: picks indices 0, 28, 57, 85, 113.

### Cutout URL

```
{access_url}?center={ra},{dec}&size=0.3
```

IRSA returns spatially cropped FITS with all HDUs.

### Parallel Download

```python
with ThreadPoolExecutor(max_workers=3) as pool:
    futures = {pool.submit(fetch_and_render, i) for i in selected}
```

**3 workers** → <5% failure rate. 5+ workers → 30–50% IRSA 503.

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

- 5-95 percentile → robust to cosmic rays / hot pixels
- `flipud` → FITS origin bottom-left, PNG top-left
- WebP quality 85 → ~20 KB at 59×59, ~130 KB at 177×177

### Cache

```python
if not webp_path.exists():
    fetch_and_render(...)
```

Cache in `static/frames/`. Persists across backend restarts.

---

## Data Flow — AI

### `/api/explain`

```python
PROMPT_TEMPLATE = """You are an astrophysicist analyzing NASA SPHEREx data.

Target: {target_name}
Position: RA {ra:.4f}°, Dec {dec:.4f}°
Unique epochs found: {unique_epochs}
Time span: {span_days:.1f} days
Cadence: {cadence_str}

Explain what kind of moving object or variable star this could be...
Keep it under 100 words. Return plain prose only."""
```

Then:
1. Try OpenRouter (Nemotron/Gemini/Llama) — `reasoning: disabled` for speed
2. Handle None content (reasoning models return `reasoning` field)
3. Fall back to direct Gemini SDK
4. Return `{"explanation", "provider", "model"}`

### `/api/chat`

```python
SYSTEM = """You are a helpful astrophysics assistant...

Current observation context:
Target: {target_name}
Position: RA {ra}°, Dec {dec}°
Unique epochs: {n}
Time span: {days} days"""
```

Full conversation history + system prompt → OpenRouter → reply.

**Context injection**: system prompt includes observation metadata so AI references the right target (not hardcoded "WISE 0855").

---

## Data Quality

### FLAGS bitmask

| Bit | Fraction set | Interpretation |
|---|---|---|
| 21 | 28.8% | Benign coverage / detection flag |
| 19 | 2.3% | Minor coverage |
| 17 | 0.1% | Edge |
| 0, 2, 11 | <1% | Minor |

**Strict-bad (bits 3+ excluding benign)**: 0.00%.

Naive `FLAGS != 0` counts benign as bad (31.4% flagged). Backend uses bitmask-aware check.

### WCS Validation

```python
wcs = WCS(hdul["IMAGE"].header)
assert wcs.has_celestial  # passes for all cutouts
```

### VARIANCE

Median 8.4e-4 MJy²/sr². Physically reasonable.

---

## Extension Sizes (0.3° cutout, ~177×177 px)

| Extension | Shape | Size | Purpose |
|---|---|---|---|
| IMAGE | 177×177 | 130 KB | Science data |
| FLAGS | 177×177 | 130 KB | Bitmask |
| VARIANCE | 177×177 | 130 KB | Per-pixel variance |
| ZODI | 177×177 | 130 KB | Zodiacal light |
| **PSF** | 101×101×121 | **4.5 MB (95%)** | Point spread function |
| WCS-WAVE | table | tiny | Wavelength solution |

**PSF is 95% of file size.** IRSA cutout service doesn't support HDU filtering (`hdu=1` ignored). Full download unavoidable.

**Implication**: 5 frames = ~25 MB from IRSA. First fetch 90–180 s. Solution: cache + pre-warm.

---

## Rate Limiting & Retry

### The 503 problem

IRSA enforces per-IP rate limits. Aggressive parallel → 503.

**Symptoms**: 5+ workers → 30–50% failure.

**Mitigation**:
- 3 workers max
- Exponential backoff (3s → 6s → 12s, 3 attempts)
- Disk cache — never refetch successful frames
- Cutout service — 14× less data than full MEF

**Net**: >95% success on cache misses.

---

## Frontend — State Management

### Zustand store

```typescript
const useStore = create<AppState>()(
  persist((set) => ({...}), { name: 'spherex-viewer-storage', storage: createJSONStorage(() => localStorage) })
)
```

- Mockup state (target, band, mode, overlays, discovery logs)
- Persisted to localStorage
- Named exports: `useAppStore`, `useTargetState`, `useViewerState`, etc.

### URL params sync (P1 fix)

`LiveDataPanel` reads `?ra=&dec=&n_frames=` on mount, auto-fetches if valid. After every fetch, `syncUrl()` writes back to URL via `history.replaceState`.

`ShareModal` reads `window.location.href` — reflects live state, not mockup.

### Target name resolution

```typescript
function resolveTargetName(ra: number, dec: number): string {
  for (const key of Object.keys(PRESET_TARGETS)) {
    const t = PRESET_TARGETS[key]
    if (Math.abs(t.raDeg - ra) < 0.1 && Math.abs(t.decDeg - dec) < 0.1) {
      return t.name
    }
  }
  return `RA ${ra.toFixed(2)}° / Dec ${dec.toFixed(2)}°`
}
```

Dynamic — used in AI explain, AI chat, chat placeholder.

### Client-side validation

```typescript
function validateInputs(raStr, decStr, frames): string | null {
  const ra = parseFloat(raStr), dec = parseFloat(decStr)
  if (isNaN(ra) || ra < 0 || ra >= 360) return 'RA must be between 0 and 360°'
  if (isNaN(dec) || dec < -90 || dec > 90) return 'Dec must be between -90° and 90°'
  if (frames < 1 || frames > 10) return 'Frames must be 1–10'
  return null
}
```

Friendly errors shown before API call. Pydantic 422 messages extracted to friendly text if backend rejects.

---

## CI Pipeline

`.github/workflows/spherex-test.yml`:

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
        with: { name: spherex-artifacts, path: outputs/ }
```

**Each step catches a bug class**:
- Pipeline test → IRSA access, FITS structure, WCS
- FLAGS decode → bitmask parsing, int32 overflow (caught real bug)
- Epoch analysis → date range, dedup logic

---

## Deployment (Live)

### Render — Backend

```yaml
# render.yaml (backend service)
services:
  - type: web
    name: spherex-planet-x
    runtime: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: OPENROUTER_API_KEY
        sync: false
      - key: OPENROUTER_MODEL
        value: nvidia/nemotron-3.5-super-vl:free
    healthCheckPath: /health
```

**Free tier caveat**: 15-min sleep → 30-sec cold start. Pre-warm 5 min before demo.

### Render — Frontend (static)

```yaml
services:
  - type: web
    name: spherex-planet-x-1
    runtime: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_BACKEND_URL
        value: https://spherex-planet-x.onrender.com
```

### Backend URL configuration (frontend)

```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
```

Works in both dev (falls back to localhost) and prod (uses Render URL).

### Cache in production

Current: `static/frames/` on backend disk (per-instance, lost on redeploy).
Future: Redis + S3 for shared cache across instances.

---

## Future Extensions

| Feature | Complexity | Value |
|---|---|---|
| Wire Design Vision panels to real FITS | Medium | High (closes mockup gap) |
| Spectral flipbook (102 channels) | Medium | High (unique to SPHEREx) |
| Redis cache + background sync | Medium | High (perf) |
| Multi-target comparison | Low | Medium |
| Aladin Lite sky overlay | Medium | Medium |
| Bundle Tailwind (drop CDN) | Low | Medium (prod quality) |
| User accounts + saved views | High | Low (post-MVP) |

---

## Key Files

| File | Purpose |
|---|---|
| `app/main.py` | FastAPI: 3 endpoints + AI fallback chain |
| `src/components/LiveDataPanel.tsx` | Real data + AI chat + URL sync + validation |
| `src/components/ShareModal.tsx` | URL copy from `window.location` |
| `src/components/Header.tsx` | Share button → `onShareClick` prop |
| `src/App.tsx` | Full layout + share modal wiring |
| `src/components/SkyViewerCanvas.tsx` | Canvas + play/pause + 4 modes |
| `src/components/SEDChart.tsx` | Chart.js plot (fixed 0-height) |
| `src/store/index.ts` | Zustand store with persistence |
| `src/constants/presets.ts` | 6 preset targets |
| `vite.config.ts` | Dev proxy (`/api`, `/static`) |
| `.github/workflows/spherex-test.yml` | CI pipeline |
| `requirements.txt` / `package.json` | Dependencies |