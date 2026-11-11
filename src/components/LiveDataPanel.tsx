/**
 * LiveDataPanel — Real SPHEREx flipbook + AI insight + AI chat.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Play, Pause, Loader2, AlertCircle, Satellite, Clock, Database, Layers,
  Sparkles, Brain, Send, MessageSquare, CheckCircle2, Activity,
} from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

interface Frame {
  frame_index: number
  epoch_mjd: number
  epoch_date: string
  image_url: string
  mef_url: string
}
interface ApiResponse {
  ra: number
  dec: number
  collection: string
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
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function LiveDataPanel() {
  const [ra, setRa] = useState('133.795129')
  const [dec, setDec] = useState('-7.245147')
  const [nFrames, setNFrames] = useState(5)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [frameIdx, setFrameIdx] = useState(0)
  const [playing, setPlaying] = useState(false)

  // AI insight state
  const [aiText, setAiText] = useState('')
  const [aiDisplay, setAiDisplay] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiProvider, setAiProvider] = useState('')

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Auto-play flipbook
  useEffect(() => {
    if (!playing || !data || data.frames.length < 2) return
    const t = setInterval(() => setFrameIdx(i => (i + 1) % data.frames.length), 600)
    return () => clearInterval(t)
  }, [playing, data])

  // Auto-scroll chat
  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, chatLoading])

  // Typewriter for AI insight
  useEffect(() => {
    setAiDisplay('')
    if (!aiText) return
    let i = 0
    const t = setInterval(() => {
      if (i < aiText.length) setAiDisplay(aiText.slice(0, ++i))
      else clearInterval(t)
    }, 18)
    return () => clearInterval(t)
  }, [aiText])

  const fetchFrames = useCallback(async () => {
    setLoading(true); setError(null); setData(null); setFrameIdx(0); setPlaying(false)
    setAiText(''); setAiDisplay(''); setAiError(null); setAiProvider('')
    setMessages([]); setChatError(null)
    try {
      const res = await fetch(`${BACKEND_URL}/api/cutouts/frames`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ra: parseFloat(ra), dec: parseFloat(dec),
          size_deg: 0.1, n_frames: nFrames, collection: 'spherex_qr2',
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
      setData(await res.json())
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [ra, dec, nFrames])

  const fetchAIInsight = useCallback(async () => {
    if (!data) return
    setAiLoading(true); setAiError(null); setAiText(''); setAiDisplay('')
    try {
      const r = await fetch(`${BACKEND_URL}/api/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ra: data.ra, dec: data.dec, target_name: 'WISE 0855',
          unique_epochs: data.meta.unique_epochs,
          span_days: data.meta.span_days,
          cadence_hours: data.meta.cadence_hours,
        }),
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`)
      const j = await r.json()
      setAiText(j.explanation)
      setAiProvider(`${j.provider} · ${j.model}`)
    } catch (e: any) {
      setAiError(e.message || String(e))
    } finally {
      setAiLoading(false)
    }
  }, [data])

  const sendChat = useCallback(async () => {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    const newMsg: ChatMessage = { role: 'user', content: text }
    const updated = [...messages, newMsg]
    setMessages(updated)
    setChatInput('')
    setChatLoading(true)
    setChatError(null)

    try {
      const r = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.slice(-6),  // last 6 turns to keep context small
          context: data ? {
            ra: data.ra, dec: data.dec,
            target_name: 'WISE 0855',
            unique_epochs: data.meta.unique_epochs,
            span_days: data.meta.span_days,
          } : null,
        }),
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`)
      const j = await r.json()
      setMessages([...updated, { role: 'assistant', content: j.reply }])
    } catch (e: any) {
      setChatError(e.message || String(e))
    } finally {
      setChatLoading(false)
    }
  }, [chatInput, messages, chatLoading, data])

  const currentFrame = data?.frames[frameIdx]
  const currentImageUrl = currentFrame
    ? currentFrame.image_url.startsWith('http')
      ? currentFrame.image_url
      : `${BACKEND_URL}${currentFrame.image_url}`
    : null

  // Compute REAL quality stats from response
  const quality = data ? {
    frameSuccess: `${data.returned_frames}/${nFrames}`,
    successPct: Math.round((data.returned_frames / nFrames) * 100),
    cadence: data.meta.cadence_hours != null
      ? data.meta.cadence_hours < 24
        ? `${data.meta.cadence_hours.toFixed(1)}h`
        : `${(data.meta.cadence_hours / 24).toFixed(1)}d`
      : '—',
    spanDays: data.meta.span_days.toFixed(0),
    collection: data.collection,
  } : null

  return (
    <section className="w-full bg-[#0a0f1c] border border-cyan-500/20 rounded-xl p-4 shadow-[0_0_30px_rgba(0,243,255,0.05)] font-mono">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
        <Satellite className="w-5 h-5 text-cyan-400" />
        <h2 className="text-base font-bold text-cyan-300 tracking-wide">LIVE SPHEREx DATA</h2>
        <span className="ml-auto text-[10px] text-slate-500 px-2 py-0.5 border border-slate-700 rounded">
          NASA / IRSA · QR2
        </span>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <label className="flex flex-col text-[10px] text-slate-400 uppercase tracking-wider">
          RA (deg)
          <input value={ra} onChange={e => setRa(e.target.value)}
            className="mt-1 bg-[#0f172a] border border-slate-700 focus:border-cyan-500 rounded px-2 py-1.5 text-sm text-slate-100 font-mono outline-none transition" />
        </label>
        <label className="flex flex-col text-[10px] text-slate-400 uppercase tracking-wider">
          DEC (deg)
          <input value={dec} onChange={e => setDec(e.target.value)}
            className="mt-1 bg-[#0f172a] border border-slate-700 focus:border-cyan-500 rounded px-2 py-1.5 text-sm text-slate-100 font-mono outline-none transition" />
        </label>
        <label className="flex flex-col text-[10px] text-slate-400 uppercase tracking-wider">
          Frames
          <input type="number" min={1} max={10} value={nFrames}
            onChange={e => setNFrames(Math.max(1, Math.min(10, parseInt(e.target.value) || 5)))}
            className="mt-1 bg-[#0f172a] border border-slate-700 focus:border-cyan-500 rounded px-2 py-1.5 text-sm text-slate-100 font-mono outline-none transition" />
        </label>
        <button onClick={fetchFrames} disabled={loading}
          className="self-end bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold px-4 py-1.5 rounded flex items-center justify-center gap-2 text-sm transition shadow-[0_0_15px_rgba(0,243,255,0.3)]">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'FETCHING…' : 'FETCH'}
        </button>
      </div>

      {loading && (
        <div className="bg-cyan-950/20 border border-cyan-500/30 rounded p-3 text-xs mb-4">
          <div className="text-cyan-300 font-bold mb-1 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Downloading from NASA IRSA…
          </div>
          <div className="text-slate-400">Fetching {nFrames} real SPHEREx epochs. First request: 90-180 sec · Cached: &lt;500 ms</div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-950/30 border border-red-500/30 rounded p-3 text-xs text-red-300 mb-4">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="font-mono break-all">{error}</span>
        </div>
      )}

      {data && currentFrame && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <StatCard icon={<Database className="w-3 h-3" />} label="MEFs" value={data.total_found.toString()} />
            <StatCard icon={<Layers className="w-3 h-3" />} label="Epochs" value={data.meta.unique_epochs.toString()} />
            <StatCard icon={<Clock className="w-3 h-3" />} label="Span" value={`${data.meta.span_days.toFixed(0)}d`} />
            <StatCard icon={<Satellite className="w-3 h-3" />} label="Frames" value={`${data.returned_frames}/${nFrames}`} />
          </div>

          {/* Image viewer */}
          <div className="bg-black rounded-lg overflow-hidden relative aspect-square max-w-md mx-auto mb-4 border border-slate-800">
            <img src={currentImageUrl!} alt={`Epoch ${frameIdx + 1}`}
              className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-3 py-2 text-[11px] flex justify-between items-center font-mono">
              <span className="text-cyan-400">
                [{String(frameIdx + 1).padStart(2, '0')}/{String(data.frames.length).padStart(2, '0')}]
              </span>
              <span className="text-slate-300">
                {new Date(currentFrame.epoch_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
              <span className="text-slate-500">MJD {currentFrame.epoch_mjd.toFixed(2)}</span>
            </div>
          </div>

          {/* Playback */}
          <div className="flex items-center gap-3 mb-4">
            <input type="range" min={0} max={data.frames.length - 1} value={frameIdx}
              onChange={e => setFrameIdx(parseInt(e.target.value))}
              className="flex-1 accent-cyan-500 cursor-pointer" />
            <button onClick={() => setPlaying(p => !p)} disabled={data.frames.length < 2}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold px-3 py-1.5 rounded flex items-center gap-1.5 text-xs transition">
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {playing ? 'PAUSE' : 'PLAY'}
            </button>
          </div>

          {/* Real Quality Stats */}
          {quality && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3 mb-4">
              <div className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                LIVE DATA QUALITY
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <QualityStat label="Frames" value={quality.frameSuccess} ok={quality.successPct === 100} />
                <QualityStat label="Success" value={`${quality.successPct}%`} ok={quality.successPct === 100} />
                <QualityStat label="Cadence" value={quality.cadence} ok />
                <QualityStat label="Source" value={quality.collection} ok />
              </div>
            </div>
          )}

          {/* AI Insight */}
          <div className="bg-[#0a0f1c] border border-cyan-500/30 rounded-lg p-3 shadow-[0_0_20px_rgba(0,243,255,0.08)] space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Brain className="w-4 h-4 text-cyan-400" />
                AI ANALYSIS
              </div>
              <span className="text-[10px] text-slate-500">Gemini × SPHEREx</span>
            </div>

            <button onClick={fetchAIInsight} disabled={aiLoading}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 hover:from-cyan-400 hover:via-blue-400 hover:to-violet-500 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-cyan-500/30">
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {aiLoading ? 'ANALYZING…' : 'GENERATE AI INSIGHT'}
            </button>

            {aiError && (
              <div className="text-red-400 text-xs bg-red-950/20 border border-red-500/30 rounded p-2 font-mono break-all">
                ⚠ {aiError}
              </div>
            )}

            {aiDisplay && (
              <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3 text-xs text-slate-200 leading-relaxed">
                {aiDisplay}
                {aiDisplay.length < aiText.length && <span className="text-cyan-400 animate-pulse">▊</span>}
                {aiProvider && aiDisplay.length >= aiText.length && (
                  <div className="mt-2 pt-2 border-t border-slate-800 text-[9px] text-slate-500">
                    [{aiProvider}]
                  </div>
                )}
              </div>
            )}

            {!aiDisplay && !aiLoading && !aiError && (
              <div className="text-slate-500 text-xs italic text-center py-4 bg-[#0f172a]/50 rounded-lg">
                Click above for an AI interpretation of this SPHEREx data
              </div>
            )}
          </div>

          {/* AI Chat */}
          <div className="bg-[#0a0f1c] border border-violet-500/30 rounded-lg p-3 shadow-[0_0_20px_rgba(157,78,221,0.08)]">
            <button
              onClick={() => setChatOpen(o => !o)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-200 hover:text-violet-300 transition"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-violet-400" />
                ASK ABOUT THIS DATA
              </span>
              <span className="text-[10px] text-slate-500">{chatOpen ? '▾' : '▸'}</span>
            </button>

            {chatOpen && (
              <div className="mt-3 space-y-2">
                <div
                  ref={chatScrollRef}
                  className="bg-[#0f172a] border border-slate-800 rounded-lg p-2 h-56 overflow-y-auto space-y-2"
                >
                  {messages.length === 0 && (
                    <div className="text-slate-500 text-[11px] italic px-2 py-1">
                      Ask anything about WISE 0855 or SPHEREx:
                      <div className="mt-1 space-y-0.5 text-slate-400">
                        <div>• "What's a brown dwarf?"</div>
                        <div>• "Why does proper motion matter?"</div>
                        <div>• "What can we learn from 362 days?"</div>
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={m.role === 'user'
                        ? 'text-right'
                        : 'text-left'}
                    >
                      <span
                        className={
                          m.role === 'user'
                            ? 'inline-block bg-violet-500/20 border border-violet-500/40 text-violet-100 px-2.5 py-1.5 rounded-lg text-[11px] max-w-[85%] text-left'
                            : 'inline-block bg-cyan-500/10 border border-cyan-500/30 text-slate-200 px-2.5 py-1.5 rounded-lg text-[11px] max-w-[85%] text-left'
                        }
                      >
                        {m.content}
                      </span>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex items-center gap-2 text-cyan-400 text-[11px]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Thinking…
                    </div>
                  )}
                  {chatError && (
                    <div className="text-red-400 text-[11px] bg-red-950/30 border border-red-500/30 rounded p-1.5">
                      ⚠ {chatError}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                    placeholder="Ask a question about this observation…"
                    disabled={chatLoading}
                    className="flex-1 bg-[#0f172a] border border-slate-700 focus:border-violet-500 rounded px-2 py-1.5 text-xs text-slate-100 outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={sendChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-violet-500 hover:bg-violet-400 disabled:opacity-40 text-slate-950 font-bold px-3 py-1.5 rounded flex items-center gap-1 text-xs transition"
                  >
                    {chatLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!data && !loading && !error && (
        <div className="text-center text-slate-500 text-xs py-8 border border-dashed border-slate-800 rounded">
          Enter RA/DEC and press <span className="text-cyan-400">FETCH</span> to load real SPHEREx frames
        </div>
      )}
    </section>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded px-2 py-1.5">
      <div className="text-slate-500 text-[9px] uppercase tracking-wider flex items-center gap-1">
        {icon}{label}
      </div>
      <div className="text-cyan-400 font-bold text-sm mt-0.5">{value}</div>
    </div>
  )
}

function QualityStat({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="bg-[#0a0f1c] border border-slate-800 rounded px-2 py-1.5">
      <div className="text-slate-500 text-[9px] uppercase tracking-wider flex items-center gap-1">
        {ok && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
        {label}
      </div>
      <div className={`font-bold text-sm mt-0.5 ${ok ? 'text-emerald-400' : 'text-amber-400'}`}>
        {value}
      </div>
    </div>
  )
}