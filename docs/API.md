# SPHEREx Planet X — API Reference

**Base URL** (local): `http://127.0.0.1:8000`
**Base URL** (deploy): TBD (Render pending)

FastAPI auto-generated docs available at `/docs`.

---

## Endpoints

### `GET /health`

Service health check.

**Response**:
```json
{
  "status": "ok",
  "time": "2026-11-11T12:34:56.789012+00:00"
}
```

**Status codes**: `200` always (if service is up)

---

### `POST /api/cutouts/frames`

Fetch SPHEREx cutouts for a coordinate, return flipbook frames.

#### Request body

```json
{
  "ra": 133.795129,
  "dec": -7.245147,
  "size_deg": 0.1,
  "n_frames": 5,
  "collection": "spherex_qr2"
}
```

| Field | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `ra` | float | 0 ≤ ra < 360 | required | Right Ascension (degrees) |
| `dec` | float | -90 ≤ dec ≤ 90 | required | Declination (degrees) |
| `size_deg` | float | 0 < size ≤ 1.0 | `0.1` | Cutout size (degrees) |
| `n_frames` | int | 1 ≤ n ≤ 50 | `10` | Max frames to return |
| `collection` | string | | `"spherex_qr2"` | IRSA collection |

#### Response body

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

| Field | Type | Description |
|---|---|---|
| `total_found` | int | Total MEFs overlapping the coordinate |
| `returned_frames` | int | Frames actually returned (≤ `n_frames`) |
| `frames[].frame_index` | int | Original index in IRSA result |
| `frames[].epoch_mjd` | float | Observation epoch (Modified Julian Date) |
| `frames[].epoch_date` | string | ISO 8601 timestamp |
| `frames[].image_url` | string | Relative WebP URL (prefix with backend URL) |
| `frames[].mef_url` | string | Original MEF on IRSA (for debugging) |
| `meta.cadence_hours` | float \| null | Median time between frames (hours) |
| `meta.span_days` | float | Total time span across returned frames |
| `meta.unique_epochs` | int | Distinct epochs available |

#### Behavior

1. **Query**: `Irsa.query_sia` at RA/Dec with radius 0.05°
2. **Deduplicate**: round `t_min` to 1 second, keep one MEF per epoch
3. **Spread selection**: pick N frames evenly across full time range (not earliest N)
4. **Download**: parallel fetch of cutouts (3 workers)
5. **Retry**: on HTTP 5xx, exponential backoff (3s → 6s → 12s, 3 attempts)
6. **Parse**: extract IMAGE HDU from FITS
7. **Normalize**: 5-95 percentile stretch
8. **Cache**: save WebP to `static/frames/`; skip download if already cached

#### Error responses

| Status | Meaning |
|---|---|
| `400` | Invalid RA/Dec/size/n_frames (Pydantic validation) |
| `404` | No SPHEREx data at coordinate |
| `500` | All cutout downloads failed |
| `502` | IRSA query failed |

Example error:
```json
{
  "detail": "No SPHEREx data at RA=133.795129, Dec=-7.245147"
}
```

---

## Static Files

Rendered WebP frames served at:

```
GET /static/frames/<frame_id>.webp
```

`frame_id` derived from `{ra:.4f}_{dec:.4f}_{mjd:.4f}` with:
- `.` → `p` (decimal point)
- `-` → `m` (minus sign)

Example: `133p7951_m7p2451_60800p7000.webp`

---

## Frontend Integration Example

```typescript
// Fetch frames
const res = await fetch('/api/cutouts/frames', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ra: 133.795129,
    dec: -7.245147,
    size_deg: 0.1,
    n_frames: 5,
    collection: 'spherex_qr2'
  })
})
const data = await res.json()

// Display current frame
<img src={data.frames[idx].image_url} alt={`Epoch ${idx}`} />

// Caption
<span>{new Date(data.frames[idx].epoch_date).toLocaleDateString()}</span>

// Banner
<span>{data.meta.span_days.toFixed(0)} days of SPHEREx data</span>
```

**Note**: Vite proxy (`vite.config.ts`) forwards `/api` and `/static` to backend, so no CORS issues in dev.

---

## Performance Characteristics

| Scenario | Time |
|---|---|
| First request (5 uncached frames) | 90-180 seconds |
| Cached request (frames on disk) | < 500 ms |
| IRSA SIA query | 2-5 seconds |
| Per-cutout download (uncached) | 20-40 seconds |
| FITS parse + WebP render | ~50 ms per frame |

**Recommendation**: Pre-warm cache before demo. See README "Demo Strategy".

---

## Rate Limits & Retry

- **IRSA rate limits**: aggressive parallel downloads can trigger 503
- **Backend mitigation**: 3 workers max, exponential backoff on 5xx
- **Cache**: once fetched, never hits IRSA again

For heavy usage, add Redis cache + background sync (post-hackathon).