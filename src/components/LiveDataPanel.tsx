/**
 * LiveDataPanel — real SPHEREx flipbook from FastAPI backend.
 */
import { useState, useEffect } from 'react'
import { Play, Pause, Loader2, AlertCircle } from 'lucide-react'

interface Frame {
  frame_index: number
  epoch_mjd: number
  epoch_date: string
  image_url: string
}

interface ApiResponse {
  ra: number
  dec: number
  total_found: number
  returned_frames: number
  frames: Frame[]
  meta: {
    size_deg: number
    cadence_hours: number | null
    span_days: number
    unique_epochs: number
  }
}

export default function LiveDataPanel() {
  const [ra, setRa] = useState('133.795129')
  const [dec, setDec] = useState('-7.245147')
  const [nFrames, setNFrames] = useState(5)          // ✅ 10 → 5
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [frameIdx, setFrameIdx] = useState(0)
  const [playing, setPlaying] = useState(false)

  // ✅ FIXED: proper useEffect, not inline setTimeout
  useEffect(() => {
    if (!playing || !data || data.frames.length < 2) return
    const timer = setInterval(() => {
      setFrameIdx(i => (i + 1) % data.frames.length)
    }, 600)
    return () => clearInterval(timer)
  }, [playing, data])

  async function fetchFrames() {
    setLoading(true); setError(null); setData(null); setFrameIdx(0)
    try {
      const res = await fetch('/api/cutouts/frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ra: parseFloat(ra),
          dec: parseFloat(dec),
          size_deg: 0.1,
          n_frames: nFrames,
          collection: 'spherex_qr2',
        }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`)
      }
      setData(await res.json())
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const currentFrame = data?.frames[frameIdx]

  return (
    <section className="bg-space-900 border border-space-border rounded-xl p-4 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-cyan-400">
          🛰️ Live SPHEREx Data (Real Backend)
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Real NASA SPHEREx cutouts · WISE 0855 = 142 epochs over ~1 year
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <label className="flex flex-col text-xs text-slate-400">
          RA (deg)
          <input value={ra} onChange={e => setRa(e.target.value)}
            className="mt-1 bg-space-800 border border-space-border rounded px-2 py-1 text-sm text-slate-100 w-36" />
        </label>
        <label className="flex flex-col text-xs text-slate-400">
          Dec (deg)
          <input value={dec} onChange={e => setDec(e.target.value)}
            className="mt-1 bg-space-800 border border-space-border rounded px-2 py-1 text-sm text-slate-100 w-36" />
        </label>
        <label className="flex flex-col text-xs text-slate-400">
          Frames
          <input type="number" min={1} max={10} value={nFrames}
            onChange={e => setNFrames(parseInt(e.target.value) || 5)}
            className="mt-1 bg-space-800 border border-space-border rounded px-2 py-1 text-sm text-slate-100 w-20" />
        </label>
        <button onClick={fetchFrames} disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-4 py-2 rounded text-sm flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Fetching…' : 'Fetch Live Data'}
        </button>
      </div>

      {/* ✅ Loading UX — judges ko pata rahe system busy hai */}
      {loading && (
        <div className="bg-cyan-950/30 border border-cyan-500/30 rounded p-3 text-sm">
          <div className="text-cyan-300 font-bold mb-1">🛰️ Fetching real SPHEREx data…</div>
          <div className="text-slate-400 text-xs">
            Downloading {nFrames} epochs from NASA IRSA (first request ~90-180 sec, then cached).
            Each cutout is a real 59×59 pixel SPHEREx spectral image.
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-red-400 bg-red-950/30 p-3 rounded text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="font-mono break-all">{error}</span>
        </div>
      )}

      {data && currentFrame && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-space-800 rounded p-2">
              <div className="text-slate-500">Total MEFs</div>
              <div className="text-cyan-300 text-lg font-bold">{data.total_found}</div>
            </div>
            <div className="bg-space-800 rounded p-2">
              <div className="text-slate-500">Unique Epochs</div>
              <div className="text-cyan-300 text-lg font-bold">{data.meta.unique_epochs}</div>
            </div>
            <div className="bg-space-800 rounded p-2">
              <div className="text-slate-500">Time Span</div>
              <div className="text-cyan-300 text-lg font-bold">{data.meta.span_days.toFixed(0)} days</div>
            </div>
            <div className="bg-space-800 rounded p-2">
              <div className="text-slate-500">Frames Loaded</div>
              <div className="text-cyan-300 text-lg font-bold">{data.returned_frames}</div>
            </div>
          </div>

          <div className="bg-black rounded-lg overflow-hidden relative aspect-square max-w-lg mx-auto">
            <img src={currentFrame.image_url}
              alt={`Epoch ${frameIdx + 1}`}
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }} />
            <div className="absolute bottom-2 left-2 right-2 bg-black/70 rounded px-3 py-1.5 text-xs flex justify-between">
              <span className="text-cyan-300">Frame {frameIdx + 1}/{data.frames.length}</span>
              <span className="text-slate-300">{new Date(currentFrame.epoch_date).toLocaleDateString()}</span>
              <span className="text-slate-400 font-mono">MJD {currentFrame.epoch_mjd.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <input type="range" min={0} max={data.frames.length - 1} value={frameIdx}
              onChange={e => setFrameIdx(parseInt(e.target.value))}
              className="flex-1 max-w-md accent-cyan-500" />
            <button onClick={() => setPlaying(p => !p)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1.5">
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {playing ? 'Pause' : 'Play'}
            </button>
          </div>
        </>
      )}

      {!data && !loading && !error && (
        <div className="text-center text-slate-500 text-sm py-8">
          Enter RA/Dec and click "Fetch Live Data" to load real SPHEREx frames.
        </div>
      )}
    </section>
  )
}