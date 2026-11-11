# Contributing

## Branch strategy
- `main`       — protected, only via PR, CI must be green
- `develop`    — integration branch (feature → develop → main)
- `feature/<short-name>` — new features
- `fix/<short-name>`     — bug fixes
- `chore/<short-name>`   — tooling, deps

## Workflow
1. `git checkout main && git pull`
2. `git checkout -b feature/xyz`
3. Commit + push branch
4. Open PR → wait for `test-pipeline` green → merge
5. Delete branch after merge

## Sync develop regularly
```
git checkout develop
git merge origin/main
git push origin develop
```

## Directory layout
```
app/      — FastAPI backend
scripts/  — data pipeline scripts (query, fetch, render)
static/   — served files (flipbook frames, frontend assets)
outputs/  — ephemeral artifacts (gitignored)
```