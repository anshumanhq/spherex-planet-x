# 🌌 SPHEREx Planet X

**Interactive web tool that turns any RA/Dec coordinate into a time-series flipbook of real NASA SPHEREx observations.**

Built for NASA Space Apps Challenge 2026 · Team submission

---

## The Real Data

Our flipbook is not a simulation. For WISE 0855 (a nearby Y-dwarf brown dwarf):

| Metric | Value |
|---|---|
| Total MEFs covering the position | **278** |
| Unique observation epochs | **142** |
| Time span of returned flipbook | **364 days** (May 2025 → May 2026) |
| Coordinate | RA 133.795129° · Dec -7.245147° |
| Cutout size | 0.1° |
| Frames in default demo | 5 (selectable up to 20) |
| Data source | IRSA · SPHEREx QR2 release |

Every frame is a real SPHEREx spectral image — parsed from FITS, normalized, and served as WebP.

---

## What It Does

1. User enters RA/Dec (or picks a preset target like WISE 0855, Barnard's Star)
2. Backend queries NASA IRSA via SIA for SPHEREx Spectral Image MEFs at that position
3. Downloads small 0.1° cutouts (~5 MB each) — not the full 70 MB MEF
4. Parses FITS, extracts IMAGE HDU, normalizes each epoch to WebP
5. Frontend renders frames as an interactive time-series flipbook

Optional AI assistant (Gemini) explains what's visible in each epoch.

---

## ✅ Working End-to-End (Verified)

### Data pipeline
- IRSA SIA query via `astroquery.ipac.irsa.Irsa`
- QR2 collection confirmed working (QR3 not yet covering this RA/Dec)
- Cutout service integration (URL parameters `?center=RA,DEC&size=0.1`)
- FITS parsing: `IMAGE`, `FLAGS`, `VARIANCE`, `ZODI`, `PSF`, `WCS-WAVE`
- WCS validated (celestial coordinates present)
- FLAGS bitmask-aware quality checks (bit 21 = benign coverage, strict-bad rate 0%)
- Multi-epoch fetcher with **exponential backoff retry** on HTTP 5xx
- **Spread selection** — picks N frames evenly across full time range (not earliest N)
- Flipbook assembly (animated WebP + GIF)

### Backend API
- `GET /health` — service status
- `POST /api/cutouts/frames` — fetch N epochs for RA/Dec, return WebP URLs
- Retry-on-5xx with 3 attempts, exponential backoff (3s → 6s → 12s)
- Disk caching in `static/frames/` — repeated queries in **< 500 ms**

### Frontend
- Standalone React component `src/components/LiveDataPanel.tsx`
- RA/Dec input + frame count selector
- Real-time fetching from backend
- Interactive flipbook viewer with play/pause + slider
- Metadata display: total MEFs, unique epochs, time span, cadence

### CI Pipeline
- GitHub Actions workflow on every push/PR
- Runs full data pipeline test (real IRSA query in CI)
- Uploads artifacts (FITS, plots, logs)
- `main` branch protected, requires green CI + PR approval

---

## 🏗 Architecture

```
User (browser)
    ↓ RA/Dec input
Frontend (React + Vite @ :5173)
    ↓ POST /api/cutouts/frames (proxied)
Backend (FastAPI @ :8000)
    ↓ Irsa.query_sia
NASA IRSA (SIA service)
    ↓ MEF access_url
Backend
    ↓ access_url?center=RA,DEC&size=0.1
NASA IRSA (cutout service)
    ↓ ~5 MB FITS cutout
Backend
    ↓ astropy parses IMAGE HDU
    ↓ percentile normalize (5-95%)
    ↓ save as 20 KB WebP
    ↓ {"frames": [{image_url, epoch_date, ...}]}
Frontend
    ↓ <img src="/static/frames/*.webp">
User sees flipbook
```

Detailed version: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite 5 |
| Styling | Tailwind CSS (CDN) |
| Backend | Python 3.11 + FastAPI + Uvicorn |
| Astronomy | astropy 8.0, astroquery 0.4, pyvo |
| Data | FITS MEF → WebP via Pillow |
| CI/CD | GitHub Actions |
| Deployment (planned) | Render |

---

## Quick Start

### 1. Install dependencies

```
pip install -r requirements.txt
npm.cmd install       # Windows
npm install           # macOS/Linux
```

### 2. Start backend (Terminal 1)

```
uvicorn app.main:app --reload --port 8000
```

Verify: http://127.0.0.1:8000/health → `{"status":"ok"}`

### 3. Start frontend (Terminal 2)

```
npm.cmd run dev       # Windows
npm run dev           # macOS/Linux
```

Open: http://localhost:5173

### 4. Test

- RA: `133.795129`, Dec: `-7.245147` (WISE 0855)
- Frames: `5`
- Click **Fetch Live Data**

**First fetch**: 90-180 seconds (real NASA download of 5 × 5 MB cutouts)
**Subsequent fetches**: instant (disk-cached WebP frames)

---

## API Reference

### `POST /api/cutouts/frames`

**Request**:
```json
{
  "ra": 133.795129,
  "dec": -7.245147,
  "size_deg": 0.1,
  "n_frames": 5,
  "collection": "spherex_qr2"
}
```

**Response**:
```json
{
  "ra": 133.795129,
  "dec": -7.245147,
  "collection": "spherex_qr2",
  "total_found": 278,
  "returned_frames": 5,
  "frames": [
    {
      "frame_index": 210,
      "epoch_mjd": 60800.700028,
      "epoch_date": "2025-05-05T16:48:02",
      "image_url": "/static/frames/133p7951_m7p2451_60800p7000.webp",
      "mef_url": "https://irsa.ipac.caltech.edu/..."
    }
  ],
  "meta": {
    "size_deg": 0.1,
    "cadence_hours": 2104.93,
    "span_days": 364.0,
    "unique_epochs": 142
  }
}
```

Full API docs: [docs/API.md](docs/API.md)

---

## Repository Structure

```
spherex-planet-x/
├── .github/workflows/
│   └── spherex-test.yml            # CI pipeline
├── app/
│   └── main.py                     # FastAPI backend
├── scripts/
│   ├── spherex_pipeline_test.py    # End-to-end CI test
│   ├── analyze_epochs.py           # Epoch feasibility report
│   ├── decode_flags.py             # FLAGS bitmask analysis
│   ├── fetch_epoch_cutouts.py      # Multi-epoch CLI downloader
│   └── assemble_flipbook.py        # Frames → animated WebP
├── src/
│   ├── main.tsx                    # Standalone entry (LiveDataPanel)
│   ├── App.tsx                     # Full design mockup (WIP integration)
│   ├── components/
│   │   ├── LiveDataPanel.tsx       # ✅ Working backend integration
│   │   └── [Lidiya's components]   # Design vision components
│   └── ...
├── static/frames/                  # Served WebP frames (runtime cache)
├── outputs/                        # Gitignored FITS + plots
├── requirements.txt                # Python dependencies
├── package.json                    # Node dependencies
├── vite.config.ts                  # Proxy /api and /static
├── CONTRIBUTING.md                 # Team workflow
├── README.md                       # This file
└── docs/
    ├── API.md                      # Full API reference
    └── ARCHITECTURE.md             # Technical deep-dive
```

---

## Configuration

### `vite.config.ts` (dev proxy)

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    proxy: {
      '/api':    { target: 'http://localhost:8000', changeOrigin: true },
      '/static': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  resolve: { alias: { '@': '/src' } }
})
```

Enables frontend at `:5173` to reach backend at `:8000` with no CORS issues.

### `.env` (optional, for deployment)

```
# Backend
SPHEREX_COLLECTION=spherex_qr2
CACHE_DIR=static/frames
# Frontend (if not using proxy)
VITE_API_URL=http://localhost:8000
```

### Data configuration (in `app/main.py`)

| Parameter | Default | Notes |
|---|---|---|
| `size_deg` | 0.1 | Cutout size in degrees |
| `n_frames` | 10 | Max frames per request |
| `collection` | `spherex_qr2` | IRSA collection ID |
| `workers` | 3 | Parallel download threads |
| `retries` | 3 | HTTP 5xx retry attempts |
| Search radius | 0.05° | SIA query radius |

---

## Key Data Insights

### SPHEREx QR2 vs QR3

- **QR2**: 278 MEFs covering WISE 0855 — **works, use this**
- **QR3**: 0 results at this position (rolling release not yet covering)

Backend tries QR3 first, falls back to QR2 automatically.

### FLAGS bitmask (from `decode_flags.py`)

| Bit | Fraction | Interpretation |
|---|---|---|
| 21 | 28.8% | Benign coverage / detection flag |
| 19 | 2.3% | Minor coverage |
| 17 | 0.1% | Edge case |
| 0, 2, 11 | <1% total | Minor flags |
| **Strict-bad (bits 3+)** | **0.00%** | Zero bad pixels in sample |

Quality check excludes benign bits, giving 0% strict-bad rate. Data is production-quality.

### PSF dominates cutout size

For a 0.1° cutout (~5 MB FITS):

| Extension | Size |
|---|---|
| IMAGE | 14 KB |
| FLAGS | 14 KB |
| VARIANCE | 14 KB |
| ZODI | 14 KB |
| **PSF** | **4.9 MB (99%)** |
| WCS-WAVE | tiny |

IRSA cutout service does not support HDU filtering (`hdu=1` parameter ignored). Full 5 MB download unavoidable.

---

## CI / Testing

Every push and PR triggers GitHub Actions:

1. Installs Python dependencies
2. Runs `scripts/spherex_pipeline_test.py` — real IRSA query + cutout download
3. Runs `scripts/decode_flags.py` — FLAGS bitmask analysis
4. Runs `scripts/analyze_epochs.py` — epoch feasibility report
5. Uploads artifacts (FITS file, plots, logs)

View results on the **Actions** tab. Merge to `main` requires green CI.

---

## Known Limitations

| Limitation | Cause | Mitigation |
|---|---|---|
| First fetch is slow (90-180 s) | Real NASA download (5 × 5 MB) | Demo pre-warm (cache fills disk) |
| Subsequent fetches fast (<500 ms) | WebP frames disk-cached | ✅ |
| QR3 not usable | Rolling release not covering target | QR2 fallback automatic |
| Cutout includes PSF (99% size) | IRSA service doesn't support HDU filter | Accepted; PSF ignored in rendering |
| Render deploy pending | Srikanth to complete | Local demo works fully |

---

## Demo Strategy

### Pre-warm cache (run 5 min before demo)

```powershell
$body = @{
    ra = 133.795129
    dec = -7.245147
    size_deg = 0.1
    n_frames = 5
    collection = "spherex_qr2"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/cutouts/frames" `
    -Method Post -Body $body -ContentType "application/json"
```

This populates `static/frames/*.webp`. Demo-day fetches become instant.

### Talking points

- "Real NASA data" — 142 epochs of SPHEREx observations
- "364 days of WISE 0855" — one year of brown dwarf variability
- "Production pipeline" — retry logic, spread selection, bitmask-aware quality
- "Cached for speed" — pre-fetched frames serve in <500 ms

### Judge Q&A prep

- **Why WISE 0855?** Nearest brown dwarf, well-studied, but SPHEREx time-domain behavior unknown. Perfect test case.
- **How is this different from IRSA portal?** Time-series flipbook + specific target workflow. IRSA gives raw data access only.
- **Scalability?** Single-target MVP; production would need S3 + Redis caching.
- **What if IRSA goes down?** Fallback URL + retry + cache. Future: background sync.

---

## Team

| Member | Role |
|---|---|
| **Lidiya** | Frontend design + UI components |
| **Anshuman** | Backend + NASA data pipeline |
| **Srikanth** | Deployment + Demo/Pitch + GitHub setup |
| **Prateek** | AI/ML + Gemini integration |

---

## Status

**Current state**: End-to-end working locally. Backend + frontend + real data verified.

**What's live**:
- ✅ Data pipeline (IRSA → FITS → WebP → API → frontend)
- ✅ FastAPI backend with caching
- ✅ Working `LiveDataPanel` component
- ✅ CI with real data pipeline tests
- ✅ PR-based workflow with green gate

**In progress**:
- 🚧 Full-page layout (Lidiya's design mockup integration)
- 🚧 Render deployment (Srikanth)
- 🚧 Gemini AI assistant (Prateek)

**Post-hackathon roadmap**:
- Multi-target comparison mode
- Spectral flipbook (102 wavelength channels per epoch)
- Aladin Lite sky overlay
- Redis caching for horizontal scaling
- Full test coverage for frontend components

---

**Last updated**: 2026-11-11
**Repository**: [shrikanthnahak1506-svg/spherex-planet-x](https://github.com/shrikanthnahak1506-svg/spherex-planet-x)