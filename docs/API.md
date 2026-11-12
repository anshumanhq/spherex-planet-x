# SPHEREx Planet X — API Reference

**Base URL (local)**: `http://127.0.0.1:8000`
**Base URL (deploy)**: `https://spherex-planet-x.onrender.com`

FastAPI auto-generated docs: `/docs` on the backend.

---

## Endpoints

### `GET /health`

Service + AI provider availability check.

```json
{
  "status": "ok",
  "time": "2026-11-12T08:15:00.000000+00:00",
  "ai": {
    "openrouter": true,
    "gemini_direct": false
  }
}
```

| Field | Meaning |
|---|---|
| `ai.openrouter` | `true` if `OPENROUTER_API_KEY` set |
| `ai.gemini_direct` | `true` if `GEMINI_API_KEY` set + SDK installed |

**Status codes**: `200` when service is up.

---

### `POST /api/cutouts/frames`

Fetch SPHEREx cutouts for a coordinate, return flipbook frames.

#### Request

```json
{
  "ra": 133.795129,
  "dec": -7.245147,
  "size_deg": 0.3,
  "n_frames": 5,
  "collection": "spherex_qr2"
}
```

| Field | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `ra` | float | 0 ≤ ra < 360 | required | Right Ascension (deg) |
| `dec` | float | -90 ≤ dec ≤ 90 | required | Declination (deg) |
| `size_deg` | float | 0 < size ≤ 1.0 | 0.1 | Cutout size (deg) |
| `n_frames` | int | 1 ≤ n ≤ 50 | 10 | Max frames |
| `collection` | string | | `spherex_qr2` | IRSA collection |

#### Response

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
    "size_deg": 0.3,
    "cadence_hours": 2104.93,
    "span_days": 362.0,
    "unique_epochs": 142
  }
}
```

| Field | Type | Description |
|---|---|---|
| `total_found` | int | Total MEFs overlapping coordinate |
| `returned_frames` | int | Frames actually returned (≤ `n_frames`) |
| `frames[].image_url` | string | Relative WebP URL (prefix with backend URL) |
| `frames[].epoch_date` | string | ISO 8601 timestamp |
| `meta.span_days` | float | Time span across returned frames |
| `meta.cadence_hours` | float \| null | Median between frames (hours) |
| `meta.unique_epochs` | int | Distinct epochs available |

#### Behavior

1. `Irsa.query_sia` at RA/Dec, radius 0.05°
2. Deduplicate by epoch (round `t_min` to 1 sec)
3. **Spread selection** — N frames evenly across full time range
4. Parallel cutout download (3 workers)
5. Retry on 5xx (3s → 6s → 12s, 3 attempts)
6. Parse IMAGE HDU, normalize (5-95 percentile)
7. Save WebP to `static/frames/`, skip if cached

#### Errors

| Status | Meaning |
|---|---|
| `422` | Invalid inputs (Pydantic validation) |
| `404` | No SPHEREx data at coordinate |
| `500` | All downloads failed |
| `502` | IRSA query failed |

Example:
```json
{ "detail": "No SPHEREx data at RA=133.795129, Dec=-7.245147" }
```

---

### `POST /api/explain`

Generate an astrophysical interpretation of an observation.

#### Request

```json
{
  "ra": 133.795129,
  "dec": -7.245147,
  "target_name": "WISE 0855",
  "unique_epochs": 142,
  "span_days": 362,
  "cadence_hours": 2104.93
}
```

| Field | Type | Constraints | Description |
|---|---|---|---|
| `ra` | float | 0 ≤ ra < 360 | Right Ascension |
| `dec` | float | -90 ≤ dec ≤ 90 | Declination |
| `target_name` | string | 1–100 chars | Display name (preset or custom) |
| `unique_epochs` | int | ≥ 1 | Distinct epochs |
| `span_days` | float | ≥ 0 | Time span |
| `cadence_hours` | float \| null | ≥ 0 | Median gap between frames |

#### Response

```json
{
  "explanation": "WISE 0855 is a Y-dwarf brown dwarf 7.4 light-years away...",
  "provider": "openrouter",
  "model": "nvidia/nemotron-3.5-super-vl:free"
}
```

| Field | Description |
|---|---|
| `explanation` | Plain prose, under 100 words |
| `provider` | `"openrouter"` or `"gemini"` |
| `model` | Actual model used |

**Behavior**: Tries OpenRouter first → falls back to direct Gemini → returns 503 if neither configured.

#### Errors

| Status | Meaning |
|---|---|
| `422` | Invalid inputs |
| `500` | All AI providers failed |
| `503` | No AI provider configured |

---

### `POST /api/chat`

Multi-turn conversation about the current observation.

#### Request

```json
{
  "messages": [
    {"role": "user", "content": "Why does proper motion matter?"}
  ],
  "context": {
    "ra": 133.795129,
    "dec": -7.245147,
    "target_name": "WISE 0855",
    "unique_epochs": 142,
    "span_days": 362
  }
}
```

| Field | Type | Constraints | Description |
|---|---|---|---|
| `messages` | array | 1–20 messages | Conversation history |
| `messages[].role` | string | `"user"` or `"assistant"` | Message role |
| `messages[].content` | string | 1–2000 chars | Message text |
| `context` | object \| null | | Optional observation metadata |

#### Response

```json
{
  "reply": "Proper motion shows how fast the object moves across the sky...",
  "provider": "openrouter",
  "model": "nvidia/nemotron-3.5-super-vl:free"
}
```

**Behavior**: Injects context into system prompt so AI knows which observation it's discussing. Keeps last 6 messages for context window management.

#### Errors

| Status | Meaning |
|---|---|
| `422` | Invalid inputs (bad role, empty content) |
| `500` | All AI providers failed |
| `503` | No AI provider configured |

---

## Static Files

Rendered WebP frames:

```
GET /static/frames/<frame_id>.webp
```

`frame_id` = `{ra:.4f}_{dec:.4f}_{mjd:.4f}` with:
- `.` → `p`
- `-` → `m`

Example: `133p7951_m7p2451_60800p7000.webp`

---

## Frontend Integration Example

```typescript
// Fetch frames
const res = await fetch(`${BACKEND_URL}/api/cutouts/frames`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ra: 133.795129, dec: -7.245147,
    size_deg: 0.3, n_frames: 5, collection: 'spherex_qr2',
  }),
})
const data = await res.json()

// Display
<img src={`${BACKEND_URL}${data.frames[idx].image_url}`} />

// AI explain
const aiRes = await fetch(`${BACKEND_URL}/api/explain`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ra: data.ra, dec: data.dec,
    target_name: 'WISE 0855',
    unique_epochs: data.meta.unique_epochs,
    span_days: data.meta.span_days,
    cadence_hours: data.meta.cadence_hours,
  }),
})

// AI chat
const chatRes = await fetch(`${BACKEND_URL}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'What am I looking at?' }],
    context: {
      ra: data.ra, dec: data.dec,
      target_name: 'WISE 0855',
      unique_epochs: data.meta.unique_epochs,
      span_days: data.meta.span_days,
    },
  }),
})
```

**Vite proxy** (`vite.config.ts`) forwards `/api` and `/static` to backend, so no CORS issues in dev. Production uses full backend URL via `VITE_BACKEND_URL` env var.

---

## Performance

| Scenario | Time |
|---|---|
| First request (5 uncached frames, 0.3°) | 90–180 sec |
| Cached request (disk hit) | ~2–3 sec (through Render) |
| AI explain (cold) | 2–5 sec |
| AI chat (with history) | 1–3 sec |
| IRSA SIA query | 2–5 sec |

**Demo recommendation**: Pre-warm cache 5 min before demo. See README "Demo Strategy".

---

## Rate Limits & Retry

- **IRSA**: aggressive parallel download → 503. Backend uses 3 workers + exponential backoff
- **OpenRouter free tier**: rate limited during peak hours. Backend falls back to direct Gemini
- **Cache**: successful frames never refetch from IRSA

For high traffic: add Redis cache + background sync (post-hackathon).