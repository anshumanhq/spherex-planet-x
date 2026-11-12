# Contributing

Team workflow for SPHEREx Planet X.

---

## Branch Strategy

| Branch | Purpose | Protection |
|---|---|---|
| `main` | Production, deployed | Protected — requires PR + green CI |
| `develop` | Integration | Merge features here first |
| `feature/<name>` | New features | — |
| `fix/<name>` | Bug fixes | — |
| `chore/<name>` | Tooling, deps, docs | — |

---

## Standard Workflow

### 1. Start from latest main

```
git checkout main
git pull origin main
```

### 2. Create feature branch

```
git checkout -b feature/short-name
```

### 3. Make changes, commit, push

```
git add .
git commit -m "feat: short description"
git push origin feature/short-name
```

### 4. Open Pull Request on GitHub

- Base: `main`
- Compare: `feature/short-name`
- Wait for CI (`test-pipeline`) to pass
- Review if needed
- **Squash and merge**

### 5. Delete branch after merge

GitHub auto-deletes with "Delete branch" after merge.

---

## Commit Message Convention

| Prefix | Use for |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Tooling, deps, cleanup |
| `docs:` | Documentation only |
| `test:` | Tests |
| `refactor:` | Restructure (no behavior change) |

---

## CI Requirements

Every PR runs `.github/workflows/spherex-test.yml`:

1. `pip install -r requirements.txt`
2. `python scripts/spherex_pipeline_test.py` (real IRSA query + FITS parse)
3. `python scripts/decode_flags.py` (FLAGS analysis)
4. `python scripts/analyze_epochs.py` (epoch feasibility report)
5. Uploads artifacts: FITS, plots, logs

**All steps must pass** before merge.

---

## Local Development

### Backend

```
pip install -r requirements.txt

# Set AI env var (PowerShell)
$env:OPENROUTER_API_KEY = "sk-or-v1-..."
$env:OPENROUTER_MODEL = "nvidia/nemotron-3.5-super-vl:free"

uvicorn app.main:app --reload --port 8000
```

Test: http://127.0.0.1:8000/docs

### Frontend

```
npm.cmd install       # Windows
npm install           # macOS/Linux

npm.cmd run dev       # Windows
npm run dev           # macOS/Linux
```

Test: http://localhost:5173

### Full integration test

1. Backend on `:8000`
2. Frontend on `:5173`
3. Browser: RA `133.795129`, Dec `-7.245147`, Frames `5`
4. Click **FETCH** → flipbook loads
5. Click **GENERATE AI INSIGHT** → text streams
6. Open **ASK ABOUT THIS DATA** → type question → AI replies
7. Click **Share Coordinates** → modal shows current URL with params
8. Open URL in new tab → auto-fetches same observation

---

## Windows / PowerShell Notes

### Use `npm.cmd` instead of `npm`

PowerShell blocks `.ps1` scripts by default:

```
npm.cmd install
npm.cmd run dev
```

**Permanent fix** (one-time):

```
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Use `;` instead of `&&`

PowerShell 5.1 doesn't support `&&`:

```
git checkout main; git pull origin main
```

---

## Directory Layout

```
app/          — FastAPI backend (3 endpoints)
scripts/      — Data pipeline + utilities (CLI-runnable)
src/          — React frontend
static/       — Served files (flipbook WebP cache)
outputs/      — Local artifacts (gitignored)
docs/         — Project documentation
```

---

## Do NOT Commit

| Item | Why |
|---|---|
| `node_modules/` | Auto-installed |
| `outputs/` | Local artifacts (FITS, plots) |
| `static/frames/*.webp` | Generated at runtime |
| `.env` / `.env.local` | **Secrets** — API keys |
| `venv/` | Python virtual env |

`.gitignore` handles all these automatically. **Never commit API keys.**

---

## AI Configuration

Backend reads from environment variables:

| Variable | Required | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes (for AI) | Primary AI provider |
| `OPENROUTER_MODEL` | No (defaults to Nemotron) | Model name |
| `GEMINI_API_KEY` | No | Direct Gemini fallback |
| `GEMINI_MODEL` | No | Fallback model |

**Never hardcode API keys in source files.** Use `.env` (gitignored) or shell env vars.

**Rotate keys** if they appear in chat/commits: https://openrouter.ai/keys

---

## Testing

### Backend tests (CI)

```
python scripts/spherex_pipeline_test.py
python scripts/decode_flags.py
python scripts/analyze_epochs.py
```

All three must pass locally before pushing.

### Frontend build test

```
npm.cmd run build
```

Should complete without TypeScript errors.

### AI endpoint smoke test

```powershell
$body = @{
    ra = 133.795129
    dec = -7.245147
    target_name = "WISE 0855"
    unique_epochs = 142
    span_days = 362
    cadence_hours = 2104.93
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/explain" `
    -Method Post -Body $body -ContentType "application/json"
```

Expected: JSON with `explanation`, `provider`, `model`.

---

## Data Pipeline Scripts

| Script | Purpose |
|---|---|
| `spherex_pipeline_test.py` | End-to-end CI test |
| `decode_flags.py` | FLAGS bitmask analysis |
| `analyze_epochs.py` | Epoch feasibility report |
| `fetch_epoch_cutouts.py` | CLI bulk downloader |
| `assemble_flipbook.py` | Frames → animated WebP/GIF |

Run any script directly:

```
python scripts/analyze_epochs.py
```

---

## Questions / Issues

Open a GitHub Issue with:
- Branch name
- Error message (full traceback)
- Steps to reproduce
- OS + Python + Node version