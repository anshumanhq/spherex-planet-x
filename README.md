<div align="center">

# 🌌 SPHEREx Planet X

### *An AI-powered, interactive time-series flipbook for NASA's SPHEREx mission*

**Built by Altivon Builders** · NASA Space Apps Challenge 2026

[![Hackathon](https://img.shields.io/badge/NASA%20Space%20Apps-2026-0B3D91?style=for-the-badge&logo=nasa&logoColor=white)](https://www.spaceappschallenge.org/)
[![NASA Data](https://img.shields.io/badge/NASA%20Data-IRSA%20%7C%20SPHEREx-00B4D8?style=for-the-badge)](https://irsa.ipac.caltech.edu/)
[![AI Powered](https://img.shields.io/badge/AI%20Powered-Gemini%20%7C%20OpenRouter-9D4EDD?style=for-the-badge)](https://openrouter.ai/)
[![MIT License](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)](LICENSE)

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org/)
[![Astropy](https://img.shields.io/badge/Astropy-8.0-FF6B35?style=flat-square)](https://www.astropy.org/)

</div>

---

<div align="center">

### 🚀 [**Live Demo**](https://spherex-planet-x-1.onrender.com) &nbsp;·&nbsp; 📡 [**API Docs**](https://spherex-planet-x.onrender.com/docs) &nbsp;·&nbsp; 💻 [**GitHub**](https://github.com/shrikanthnahak1506-svg/spherex-planet-x)

</div>

---

## 🔭 Overview

**SPHEREx Planet X** is an interactive web tool that transforms any RA/Dec sky coordinate into a **time-series flipbook of real NASA SPHEREx observations** — parsed directly from NASA's Infrared Science Archive (IRSA), rendered as animated flipbook frames, and analyzed in real time by AI.

### The Challenge

NASA's SPHEREx telescope maps the entire sky in **102 infrared bands** every 6 months, hunting for the building blocks of life and the origins of the universe. The data is public — but it's served as **70 MB FITS files** with no easy way for citizens to explore it.

### Our Solution

We built a **3-part pipeline** that makes SPHEREx data accessible in seconds:

1. **Query** — Enter any RA/Dec coordinate
2. **Render** — Backend fetches small cutouts (~5 MB) from IRSA and converts them to WebP flipbook frames
3. **Interpret** — AI generates astrophysical analysis + multi-turn chat about the observation

For **WISE 0855** (nearest Y-dwarf brown dwarf, 7.4 light-years away), our tool retrieved **278 MEFs**, deduplicated to **142 unique epochs spanning 362 days** — real telescope data, ready to play as a 13-month flipbook.

---

## ✨ Key Features

### 🛰️ Real NASA Data
- Live queries to **IRSA SIA service** via `astroquery`
- **Cutout service** downloads just the 0.3° region — **93% smaller** than full MEFs
- FITS parsing with `astropy` — extracts IMAGE, FLAGS, VARIANCE, ZODI, PSF, WCS-WAVE
- **Bitmask-aware quality checks** (0% strict-bad pixels for WISE 0855)

### 🎬 Interactive Flipbook
- Real SPHEREx images rendered as **animated WebP frames**
- **Play / Pause** with adjustable frame rate
- **Frame slider** for precise navigation
- **Auto-fetch URL sharing** — opening a shared link loads the same observation
- Smart **spread selection** picks frames evenly across full time range

### 🤖 AI Integration
- **Gemini via OpenRouter** generates ~80-word astrophysical interpretations
- **Multi-turn AI chat** — ask follow-up questions about the observation
- **Dynamic target resolution** — knows if you're looking at WISE 0855 or custom coordinates
- Graceful **provider fallback** chain (OpenRouter → Gemini → clear error)

### 🎨 Design Vision (UI Mockup)
- Interactive canvas with **4 viewing modes** (Standard, Difference, Stack, RGB)
- **SED spectrum chart** (Chart.js) showing flux vs wavelength
- **102-band selector** across 6 detector arrays
- **Catalog overlays** (Gaia, WISE, SIMBAD) with toggle switches
- **Citizen discovery log** with CSV export

### 🏗️ Production-Grade Engineering
- **CI/CD** on GitHub Actions with real IRSA tests
- **Disk caching** — cached fetches in ~2-3 sec
- **Exponential backoff retry** on IRSA 5xx errors
- **Client-side validation** with friendly error messages
- **Accessibility** (aria-labels, keyboard navigation)
- **Protected `main` branch** — every PR requires green CI

---

## 📊 The Real Data

Every frame in our flipbook is a **real SPHEREx telescope image** — not a simulation.

<div align="center">

| Metric | Value |
|:---|:---|
| 🎯 **Target** | WISE 0855 (nearest Y-dwarf brown dwarf) |
| 📍 **Coordinate** | RA 133.795129° · Dec -7.245147° |
| 📦 **Total MEFs at position** | **278** |
| 🕐 **Unique observation epochs** | **142** |
| 📅 **Time span** | **362 days** (May 2025 → May 2026) |
| 🎞️ **Frames in default demo** | 5 (selectable 1–10) |
| 🗜️ **Bandwidth savings** | **93%** (5 MB cutouts vs 70 MB MEFs) |
| ✅ **Strict-bad pixels** | **0.00%** |
| 🛰️ **Data source** | NASA IRSA · SPHEREx QR2 release |

</div>

### Why Cutouts?

A full SPHEREx MEF file is **~70 MB** — 99% of which is the PSF (point spread function) extension. For flipbook rendering, we only need the **IMAGE HDU**. IRSA's cutout service delivers a spatially cropped version at **~5 MB per frame** — a **93% bandwidth reduction** with zero loss in visual quality.

### Data Quality

FLAGS bitmask analysis reveals bit 21 (28.8% of pixels) is a **benign coverage flag**, not a data error. Naive `FLAGS != 0` checks count 31.4% as "bad" — our **bitmask-aware quality check** excludes benign bits, giving **0% strict-bad rate**.

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="33%">

### 🎨 Frontend

- **React 18** + TypeScript
- **Vite 5** (dev + build)
- **Tailwind CSS** (design system)
- **Zustand** (state management)
- **Chart.js** (SED visualization)
- **Lucide React** (icons)
- **Tailwind dark mode**

</td>
<td valign="top" width="33%">

### ⚙️ Backend

- **Python 3.11** + FastAPI
- **Uvicorn** (ASGI server)
- **Astropy 8.0** (FITS parsing)
- **Astroquery** (IRSA SIA)
- **Pillow** (WebP rendering)
- **NumPy** (array ops)
- **Disk cache** (WebP frames)

</td>
<td valign="top" width="33%">

### 🤖 AI & DevOps

- **Gemini Flash** (via OpenRouter)
- **OpenRouter** (multi-provider)
- **httpx** (async API calls)
- **GitHub Actions** (CI/CD)
- **Render** (deployment)
- **MIT License**

</td>
</tr>
</table>

---

## 🚀 Local Setup

### Prerequisites

- **Python 3.11+** · **Node.js 18+** · **npm** · **Git**
- Free **OpenRouter API key** from [openrouter.ai/keys](https://openrouter.ai/keys)

### 1. Clone the Repository

```
git clone https://github.com/shrikanthnahak1506-svg/spherex-planet-x.git
cd spherex-planet-x
```

### 2. Backend Setup (Terminal 1)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Set AI environment variables
# Windows (PowerShell)
$env:OPENROUTER_API_KEY = "sk-or-v1-YOUR-KEY-HERE"
$env:OPENROUTER_MODEL = "nvidia/nemotron-3.5-super-vl:free"

# macOS/Linux
export OPENROUTER_API_KEY="sk-or-v1-YOUR-KEY-HERE"
export OPENROUTER_MODEL="nvidia/nemotron-3.5-super-vl:free"

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

**Verify backend**: http://127.0.0.1:8000/health → should return `{"status":"ok", "ai":{"openrouter":true}}`

### 3. Frontend Setup (Terminal 2)

```bash
# Install Node dependencies
npm install

# Or on Windows PowerShell:
npm.cmd install

# Start dev server
npm run dev

# Or on Windows:
npm.cmd run dev
```

**Open**: http://localhost:5173

### 4. Test the Flipbook

1. Leave defaults: **RA `133.795129`**, **Dec `-7.245147`**, **Frames `5`**
2. Click **FETCH** → wait 90-180 sec (first time only, downloads real NASA data)
3. Click **PLAY** to cycle frames
4. Click **GENERATE AI INSIGHT** for astrophysical analysis
5. Click **ASK ABOUT THIS DATA** to chat about the observation

**Cached fetches**: after the first run, subsequent fetches return in **~2-3 seconds** from disk cache.

### Environment Variables

See [`.env.example`](.env.example) for full template:

```bash
OPENROUTER_API_KEY=sk-or-v1-...       # Required for AI features
OPENROUTER_MODEL=nvidia/nemotron-3.5-super-vl:free
VITE_BACKEND_URL=http://localhost:8000  # Frontend backend URL
```

> ⚠️ **Never commit `.env`** — it's in `.gitignore`.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/health` | Service status + AI provider check |
| `POST` | `/api/cutouts/frames` | Fetch N SPHEREx epochs for RA/Dec |
| `POST` | `/api/explain` | Generate ~80-word AI interpretation |
| `POST` | `/api/chat` | Multi-turn conversational AI |

**Full API reference**: [docs/API.md](docs/API.md) · **Interactive docs**: [/docs](https://spherex-planet-x.onrender.com/docs)

### Example Request

```bash
curl -X POST https://spherex-planet-x.onrender.com/api/cutouts/frames \
  -H "Content-Type: application/json" \
  -d '{
    "ra": 133.795129,
    "dec": -7.245147,
    "size_deg": 0.3,
    "n_frames": 5,
    "collection": "spherex_qr2"
  }'
```

### Example Response

```json
{
  "total_found": 278,
  "returned_frames": 5,
  "frames": [
    {
      "epoch_mjd": 60800.700028,
      "epoch_date": "2025-05-05T16:48:02",
      "image_url": "/static/frames/133p7951_m7p2451_60800p7000.webp"
    }
  ],
  "meta": {
    "span_days": 362.0,
    "unique_epochs": 142,
    "cadence_hours": 2104.93
  }
}
```

---

## 🏗️ Architecture

```
User (browser)
    ↓ RA/Dec input or ?ra=X&dec=Y URL
Frontend (React + Vite)
    ↓ POST /api/cutouts/frames
Backend (FastAPI)
    ↓ Irsa.query_sia(pos, collection)
NASA IRSA SIA service
    ↓ 278 MEF access URLs
Backend
    ↓ Deduplicate → 142 epochs → spread-select N frames
    ↓ access_url?center=RA,DEC&size=0.3
NASA IRSA cutout service
    ↓ ~5 MB FITS per cutout
Backend
    ↓ astropy parses IMAGE HDU
    ↓ percentile normalize (5-95%)
    ↓ save as 20 KB WebP
Frontend ← JSON response
    ↓ Flipbook plays + AI analyzes
User sees 13 months of SPHEREx data
```

**Deep-dive**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 📁 Project Structure

```
spherex-planet-x/
├── .github/workflows/         # CI pipeline (real IRSA tests)
├── app/main.py                # FastAPI backend (3 endpoints)
├── scripts/                   # Data pipeline utilities
│   ├── spherex_pipeline_test.py
│   ├── decode_flags.py
│   ├── analyze_epochs.py
│   └── assemble_flipbook.py
├── src/                       # React frontend
│   ├── main.tsx               # Entry point
│   ├── App.tsx                # Layout
│   ├── components/
│   │   ├── LiveDataPanel.tsx  # Real data + AI chat
│   │   ├── SkyViewerCanvas.tsx
│   │   ├── SEDChart.tsx
│   │   ├── ShareModal.tsx
│   │   └── ...
│   ├── store/                 # Zustand state
│   └── constants/presets.ts
├── static/frames/             # WebP cache (runtime)
├── docs/
│   ├── API.md
│   └── ARCHITECTURE.md
├── requirements.txt           # Python deps
├── package.json               # Node deps
├── vite.config.ts             # Dev proxy
├── LICENSE                    # MIT
└── README.md                  # ← You are here
```

---

## 🎯 Roadmap

**Completed** ✅
- Real NASA SPHEREx data pipeline
- Interactive flipbook + AI insights
- AI chat with observation context
- URL-based sharing with auto-fetch
- Render deployment (frontend + backend)
- CI/CD with real IRSA tests
- Complete documentation + MIT license

**In Progress** 🚧
- Wire design vision panels to real FITS data
- Bundle Tailwind properly (currently CDN)

**Future** 🔮
- Spectral flipbook (102 wavelength channels per epoch)
- Multi-target comparison mode
- Aladin Lite sky overlay integration
- Redis cache for horizontal scaling
- Planet X candidate detection automation
- User accounts + saved observations

---

## 👥 Team — Altivon Builders

<div align="center">

| | Member | Role | Contributions |
|:---:|:---|:---|:---|
| 🛰️ | **Anshuman Singh** | **Backend & NASA Data Pipeline Lead** | IRSA integration, FITS parsing, quality pipeline, AI integration, deployment |
| 🎨 | **Lidiya** | **Frontend & UI/UX Lead** | Full React UI, design system, QA report (14 bugs found → P1/P2 fixes) |
| 🤖 | **Prateek Anand** | **AI/ML & Strategy Lead** | Gemini integration, prompt engineering, product strategy |
| 🚀 | **Srikanth** | **DevOps & Deployment Lead** | Render deployment, GitHub setup, CI/CD, pitch support |

</div>

---

## 📄 License

Released under the [**MIT License**](LICENSE).

**Data attribution**: SPHEREx data provided by [NASA/IPAC Infrared Science Archive (IRSA)](https://irsa.ipac.caltech.edu/) and is in the public domain. This project's code is independent of NASA.

**AI providers**: Uses [OpenRouter](https://openrouter.ai/) (routing to Gemini, Nemotron, Llama) and Google Gemini. See each provider's terms of service.

---

## 🙏 Acknowledgments

- **NASA** for making SPHEREx data publicly accessible
- **IPAC/IRSA** for the SIA and cutout services
- **NASA Space Apps Challenge** for the hackathon platform
- **Astropy** and **Astroquery** communities for the tools
- **OpenRouter** for free AI model access

---

<div align="center">

### ⭐ If this project inspired you, give us a star!

**Built with ❤️ and ☕ in 48 hours by Altivon Builders**

[🌌 **Live Demo**](https://spherex-planet-x-1.onrender.com) · [📡 **API Docs**](https://spherex-planet-x.onrender.com/docs) · [💻 **GitHub**](https://github.com/shrikanthnahak1506-svg/spherex-planet-x)

*"13 months of real SPHEREx observations of a brown dwarf — in one interactive flipbook, with AI that explains the science."*

</div>