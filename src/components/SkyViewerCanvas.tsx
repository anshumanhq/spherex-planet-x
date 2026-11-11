/**
 * SkyViewerCanvas — interactive canvas with working play/pause and distinct modes.
 * Fixed: play/pause timer advances epochs, modes render differently.
 */
import { useRef, useEffect, useCallback } from 'react'
import { useAppStore, useOverlayState } from '@/store'
import { PRESET_TARGETS } from '@/constants/presets'

interface SkyViewerCanvasProps {
  target: any
  fov: number
  currentEpoch: number
  isPlaying: boolean
  fps: number
  selectedBand: number
  selectedArray: number
  mode: 'standard' | 'diff' | 'stack' | 'rgb'
  zoom: number
  panOffset: { x: number; y: number }
  onEpochChange: (epoch: number) => void
  onTogglePlay: () => void
  onSetFPS: (fps: number) => void
  onNextFrame: () => void
  onPrevFrame: () => void
  onBandChange: (band: number) => void
  onArrayChange: (array: number) => void
  onModeChange: (mode: 'standard' | 'diff' | 'stack' | 'rgb') => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onAddDiscovery: (entry: { name: string; ra: string; dec: string; epoch: number }) => void
  onToggleOverlay: (overlay: 'gaia' | 'wise' | 'simbad') => void
}

function SkyViewerCanvas(props: SkyViewerCanvasProps) {
  const {
    target, currentEpoch, selectedBand, mode, zoom,
    isPlaying, fps,
  } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<any[]>([])
  const { overlays } = useOverlayState()
  const store = useAppStore.getState()

  // ── FIX: Auto-advance epochs when playing ──
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      props.onEpochChange((currentEpoch + 1) % 4)
    }, 1000 / Math.max(1, fps))
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, fps, currentEpoch])

  const generateStarfield = useCallback((canvas: HTMLCanvasElement, t: any) => {
    const count = t.starCount || 80
    const stars: any[] = []
    for (let i = 0; i < count; i++) {
      const angle = (i * 137.5) * (Math.PI / 180)
      const radius = Math.sqrt(i / count) * (canvas.width * 0.45)
      stars.push({
        x: Math.cos(angle) * radius + Math.sin(i * 99) * 40,
        y: Math.sin(angle) * radius + Math.cos(i * 33) * 40,
        mag: 2 + (i % 5) * 1.2,
        color: i % 7 === 0 ? '#ffb703' : i % 5 === 0 ? '#00f3ff' : '#ffffff',
        gaiaPm: { x: Math.sin(i) * 0.4, y: Math.cos(i) * 0.4 },
        simbadName: i % 12 === 0 ? `TYC ${2000 + i}-${i}` : null,
        isPrimaryTarget: false,
      })
    }
    stars.push({
      isPrimaryTarget: true,
      name: t.name,
      x: 0, y: 0,
      mag: t.isVariable ? 3.5 : 2.5,
      color: t.spectralType?.includes('Y') ? '#9d4edd' : t.spectralType?.includes('M') ? '#ff6b6b' : '#00f3ff',
      properMotion: t.properMotion || { ra: 0, dec: 0 },
      isBinary: t.isBinary,
      isVariable: t.isVariable,
    })
    starsRef.current = stars
  }, [])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    if (width === 0 || height === 0) return

    const centerX = width / 2
    const centerY = height / 2
    const z = zoom > 0 ? zoom : 1.0

    // Background
    ctx.fillStyle = '#060911'
    ctx.fillRect(0, 0, width, height)

    // Grid
    ctx.strokeStyle = 'rgba(31, 42, 68, 0.5)'
    ctx.lineWidth = 1
    const step = 80 * z
    for (let x = (centerX % step); x < width; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke()
    }
    for (let y = (centerY % step); y < height; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke()
    }

    const t = PRESET_TARGETS[target.key] || PRESET_TARGETS.wise0855
    if (!starsRef.current.length) generateStarfield(canvas, t)

    const bandHue = (selectedBand / 102) * 280

    starsRef.current.forEach((star: any) => {
      let posX = centerX + star.x * z
      let posY = centerY + star.y * z
      if (star.isPrimaryTarget && star.properMotion) {
        posX += (star.properMotion.ra || 0) * currentEpoch * 18 * z
        posY += (star.properMotion.dec || 0) * currentEpoch * 18 * z
      }
      let currentMag = star.mag
      if (star.isVariable) currentMag += Math.sin((currentEpoch * Math.PI / 1.5) + star.x) * 1.8
      const radius = Math.max(1.5, (6 - currentMag) * 1.8 * z)

      // ── FIX: Distinct rendering per mode ──
      if (mode === 'diff') {
        // Difference: previous position in blue, current in red
        if (star.isPrimaryTarget && currentEpoch > 0) {
          const prevX = centerX + star.x * z + (star.properMotion?.ra || 0) * (currentEpoch - 1) * 18 * z
          const prevY = centerY + star.y * z + (star.properMotion?.dec || 0) * (currentEpoch - 1) * 18 * z
          ctx.beginPath(); ctx.arc(prevX, prevY, radius + 2, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(0, 243, 255, 0.7)'; ctx.fill()
          ctx.beginPath(); ctx.arc(posX, posY, radius + 2, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255, 75, 75, 0.9)'; ctx.fill()
          // Arrow
          ctx.beginPath(); ctx.moveTo(prevX, prevY); ctx.lineTo(posX, posY)
          ctx.strokeStyle = 'rgba(255, 200, 0, 0.8)'; ctx.lineWidth = 1.5; ctx.stroke()
        } else {
          ctx.beginPath(); ctx.arc(posX, posY, radius * 0.5, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(148, 163, 184, 0.2)'; ctx.fill()
        }
      } else if (mode === 'rgb') {
        // RGB false color — hue from band
        ctx.beginPath(); ctx.arc(posX, posY, radius * 1.2, 0, Math.PI * 2)
        ctx.fillStyle = star.isPrimaryTarget ? `hsl(${bandHue}, 90%, 60%)` : star.color
        ctx.shadowBlur = 15; ctx.shadowColor = `hsl(${bandHue}, 100%, 50%)`
        ctx.fill(); ctx.shadowBlur = 0
      } else if (mode === 'stack') {
        // Stacked: brighter, larger stars (simulating co-add)
        ctx.beginPath(); ctx.arc(posX, posY, radius * 1.8, 0, Math.PI * 2)
        ctx.fillStyle = star.color; ctx.fill()
        ctx.beginPath(); ctx.arc(posX, posY, radius * 3.5, 0, Math.PI * 2)
        ctx.fillStyle = star.isPrimaryTarget ? 'rgba(0, 243, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)'
        ctx.fill()
      } else {
        // Standard
        ctx.beginPath(); ctx.arc(posX, posY, radius, 0, Math.PI * 2)
        ctx.fillStyle = star.color; ctx.fill()
        ctx.beginPath(); ctx.arc(posX, posY, radius * 2.2, 0, Math.PI * 2)
        ctx.fillStyle = star.isPrimaryTarget ? 'rgba(0, 243, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'
        ctx.fill()
      }

      // Binary pair
      if (star.isBinary && mode !== 'diff') {
        ctx.beginPath(); ctx.arc(posX + 14 * z, posY - 10 * z, radius * 0.8, 0, Math.PI * 2)
        ctx.fillStyle = '#9d4edd'; ctx.fill()
      }

      // Overlays (respect toggles)
      if (overlays.gaia && (star.isPrimaryTarget || star.gaiaPm)) {
        const vx = (star.properMotion?.ra ?? star.gaiaPm?.x ?? 0) * 12 * z
        const vy = (star.properMotion?.dec ?? star.gaiaPm?.y ?? 0) * 12 * z
        if (vx || vy) {
          ctx.beginPath(); ctx.moveTo(posX, posY); ctx.lineTo(posX + vx, posY + vy)
          ctx.strokeStyle = '#34d399'; ctx.lineWidth = 1.5; ctx.stroke()
          ctx.beginPath(); ctx.arc(posX + vx, posY + vy, 2, 0, Math.PI * 2)
          ctx.fillStyle = '#34d399'; ctx.fill()
        }
      }
      if (overlays.wise) {
        ctx.beginPath(); ctx.arc(posX, posY, radius + 6 * z, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255, 183, 3, 0.5)'; ctx.lineWidth = 1
        ctx.setLineDash([2, 3]); ctx.stroke(); ctx.setLineDash([])
      }
      if (overlays.simbad && (star.isPrimaryTarget || star.simbadName)) {
        ctx.font = '10px JetBrains Mono, monospace'
        ctx.fillStyle = star.isPrimaryTarget ? '#00f3ff' : '#94a3b8'
        ctx.fillText(
          star.isPrimaryTarget ? `${t.name} (${t.type})` : star.simbadName,
          posX + radius + 6, posY + 3,
        )
      }
    })

    // Reticle
    if (mode !== 'diff') {
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(centerX, centerY, 24, 0, Math.PI * 2); ctx.stroke()
    }
  }, [target, currentEpoch, zoom, mode, selectedBand, overlays, generateStarfield])

  // Setup canvas dimensions
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const setup = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect && rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width
        canvas.height = rect.height
        starsRef.current = []
        const t = PRESET_TARGETS[target.key] || PRESET_TARGETS.wise0855
        generateStarfield(canvas, t)
        drawCanvas()
      }
    }
    setup()
    // Delay to ensure layout done
    const timer = setTimeout(setup, 100)
    window.addEventListener('resize', setup)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', setup)
    }
  }, [target.key, generateStarfield, drawCanvas])

  // Redraw on any state change
  useEffect(() => {
    drawCanvas()
  }, [currentEpoch, zoom, mode, overlays, selectedBand, drawCanvas])

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - canvas.width / 2
    const y = e.clientY - rect.top - canvas.height / 2
    if (Math.sqrt(x * x + y * y) < 40) {
      const t = PRESET_TARGETS[target.key] || PRESET_TARGETS.wise0855
      store.addDiscoveryLog({
        name: t.name,
        ra: t.raDeg ? t.raDeg.toFixed(3) : '0',
        dec: t.decDeg ? t.decDeg.toFixed(3) : '0',
        epoch: 2025.5 + currentEpoch * 0.5,
      })
    }
  }

  return (
    <div className="bg-space-900 border border-space-border rounded-xl p-3 flex flex-col relative shadow-xl">
      {/* Mode switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 bg-space-950/70 p-2 rounded-lg border border-space-border text-xs">
        <div className="flex items-center space-x-1 bg-space-900 p-1 rounded-lg border border-space-border">
          {(['standard', 'diff', 'stack', 'rgb'] as const).map(m => (
            <button key={m} onClick={() => props.onModeChange(m)}
              className={mode === m
                ? "px-2.5 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "px-2.5 py-1 rounded text-xs font-medium text-slate-400 hover:text-slate-200"}>
              {m === 'standard' ? 'Standard' : m === 'diff' ? 'Difference' : m === 'stack' ? 'Stacked' : 'RGB'}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4 font-mono text-[11px] text-slate-300">
          <div>Epoch: <span className="text-cyan-400 font-bold">{(currentEpoch + 1)}/4</span></div>
          <div className="hidden sm:block">Mode: <span className="text-amber-400">{mode}</span></div>
        </div>
      </div>

      <div className="relative w-full aspect-video max-h-[560px] bg-black rounded-lg overflow-hidden border border-space-border">
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" onClick={handleCanvasClick} />

        <div className="absolute bottom-3 left-3 bg-space-950/85 backdrop-blur-md px-3 py-2 rounded-lg border border-space-border font-mono text-[11px] space-y-1 text-slate-300 pointer-events-none">
          <div>Target: <strong className="text-white">{target.name}</strong></div>
          <div>SNR: <span className="text-emerald-400 font-bold">{target.snr}</span></div>
          <div>Parallax: <span className="text-violet-400 font-bold">{target.parallax}</span></div>
        </div>

        <div className="absolute top-3 right-3 flex flex-col space-y-1.5">
          <button onClick={props.onZoomIn} className="w-8 h-8 rounded-lg bg-space-900/80 border border-space-border hover:border-cyan-400 text-slate-200 flex items-center justify-center">+</button>
          <button onClick={props.onZoomOut} className="w-8 h-8 rounded-lg bg-space-900/80 border border-space-border hover:border-cyan-400 text-slate-200 flex items-center justify-center">−</button>
          <button onClick={props.onResetView} className="w-8 h-8 rounded-lg bg-space-900/80 border border-space-border hover:border-cyan-400 text-slate-200 flex items-center justify-center">↺</button>
        </div>

        <div className="absolute top-3 left-3 bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 px-3 py-1 rounded-full text-xs font-mono">
          <i className="fa-solid fa-circle-dot text-cyan-400 mr-1.5" />
          {target.name}
        </div>
      </div>

      <div className="mt-3 bg-space-950 p-3 rounded-lg border border-space-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button onClick={props.onPrevFrame} className="w-8 h-8 rounded-lg bg-space-800 hover:bg-space-700 text-slate-200 flex items-center justify-center border border-space-border">◀</button>
          <button onClick={props.onTogglePlay} className="w-9 h-9 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold flex items-center justify-center">{isPlaying ? '⏸' : '▶'}</button>
          <button onClick={props.onNextFrame} className="w-8 h-8 rounded-lg bg-space-800 hover:bg-space-700 text-slate-200 flex items-center justify-center border border-space-border">▶</button>
          <span className="text-xs font-mono text-slate-400 ml-2">Speed:</span>
          <input type="range" min="1" max="8" value={fps} onChange={e => props.onSetFPS(parseInt(e.target.value))}
            className="w-20 accent-cyan-400" />
          <span className="text-xs font-mono text-cyan-400">{fps} FPS</span>
        </div>
        <div className="flex items-center space-x-1 font-mono text-[11px]">
          {[0, 1, 2, 3].map(i => (
            <span key={i} onClick={() => props.onEpochChange(i)}
              className={currentEpoch === i
                ? "px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-pointer"
                : "px-2 py-0.5 rounded bg-space-800 text-slate-400 hover:text-slate-200 cursor-pointer"}>
              {2025.5 + i * 0.5}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SkyViewerCanvas