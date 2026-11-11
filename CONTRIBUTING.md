# Contributing

Team workflow for SPHEREx Planet X.

---

## Branch Strategy

| Branch | Purpose | Protection |
|---|---|---|
| `main` | Production-ready, demo-quality | Protected — requires PR + green CI |
| `develop` | Integration branch | Merge features here first |
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
- Get team review if needed
- **Squash and merge**

### 5. Delete branch after merge

GitHub auto-deletes with "Delete branch" button after merge.

---

## Commit Message Convention

| Prefix | Use for |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Tooling, deps, cleanup |
| `docs:` | Documentation only |
| `test:` | Test additions / changes |
| `refactor:` | Code restructure (no behavior change) |

Example: `feat: add retry logic to cutout fetch`

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

1. Backend running on `:8000`
2. Frontend running on `:5173`
3. Browser: enter RA `133.795129`, Dec `-7.245147`
4. Click "Fetch Live Data"
5. Verify flipbook plays

---

## Windows / PowerShell Notes

### Use `npm.cmd` instead of `npm`

PowerShell blocks `.ps1` scripts by default. Use the `.cmd` wrapper:

```
npm.cmd install
npm.cmd run dev
```

**Permanent fix** (one-time, no admin needed):

```
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Use `;` instead of `&&`

PowerShell 5.1 doesn't support `&&`. Use `;` or separate lines:

```
git checkout main; git pull origin main
```

---

## Directory Layout

```
app/          — FastAPI backend
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
| `node_modules/` | Auto-installed via `npm install` |
| `outputs/` | Local artifacts (FITS, plots) |
| `static/frames/*.webp` | Generated at runtime (cached images) |
| `.env` / `.env.local` | Secrets / env-specific config |
| `venv/` | Python virtual env (auto-created) |

`.gitignore` handles all these automatically.

---

## Testing

### Backend tests (CI)

```
python scripts/spherex_pipeline_test.py
python scripts/decode_flags.py
python scripts/analyze_epochs.py
```

All three must pass locally before pushing (CI runs the same).

### Frontend build test

```
npm.cmd run build
```

Should complete without errors.

---

## Data Pipeline Scripts

| Script | Purpose |
|---|---|
| `spherex_pipeline_test.py` | End-to-end CI test: query → download → parse → quality |
| `decode_flags.py` | FLAGS bitmask analysis (bit-level breakdown) |
| `analyze_epochs.py` | Feasibility report: are there enough epochs? |
| `fetch_epoch_cutouts.py` | CLI bulk downloader (for offline work) |
| `assemble_flipbook.py` | Convert frames → animated WebP/GIF |

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
- OS + Python version