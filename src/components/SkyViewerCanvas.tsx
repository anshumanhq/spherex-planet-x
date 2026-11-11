/**
 * SkyViewerCanvas Component
 * WebGL/HTML5 Canvas-based astronomical image viewer with epoch blink comparator.
 * 
 * Features from original prototype:
 - Multi-Epoch Playback Controls (Play/Pause, Frame Slider, Speed adjustment, Blink vs. Side-by-Side compare)
 - Display modes: Standard, Difference Imaging (Epoch B - Epoch A), Stacked (Co-add), RGB False-Color
 - Interactive zoom, pan, field-of-view (FOV) size selector, and pixel inspector
 - 102-band SPHEREx detector selector integration
 - Gaia DR3 proper motion vectors, WISE catalog, SIMBAD object overlays
 - Target contamination metadata and discovery logging
 - Astro-tech dark theme rendering with proper motion epoch displacement
 */

import { useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '@/src/store'
import { PRESET_TARGETS, SPHEREX_ARRAYS, BAND_CENTER_WAVELENGTHS, MOLECULAR_BANDS } from '@/src/constants/presets'
import { useTargetState, useViewerState, useOverlayState } from '@/src/store'
import { addDiscoveryLog, clearDiscoveryLog } from '@/src/store'

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

function SkyViewerCanvas({ target, fov, currentEpoch, isPlaying, fps, selectedBand, selectedArray, mode, zoom, panOffset, onEpochChange, onTogglePlay, onSetFPS, onNextFrame, onPrevFrame, onBandChange, onArrayChange, onModeChange, onZoomIn, onZoomOut, onResetView, onAddDiscovery, onToggleOverlay }: SkyViewerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  // Get state from store
  const { overlays } = useOverlayState()
  const { setSelectedBand, setSelectedArray, setMode, zoomIn, zoomOut, resetView, toggleOverlay } = useAppStore.getState()

  // Setup canvas dimensions on mount/resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function setupCanvasDimensions() {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width
        canvas.height = rect.height
        drawCanvas()
      }
    }

    setupCanvasDimensions()
    window.addEventListener('resize', setupCanvasDimensions)

    return () => {
      window.removeEventListener('resize', setupCanvasDimensions)
    }
  }, [fov, currentEpoch, zoom, mode, selectedBand, selectedArray])

  // Draw canvas function - renders the sky view
  const drawCanvas = useCallback((() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const currentZoom = zoom > 0 ? zoom : 1.0

    // Clear Background
    ctx.fillStyle = '#060911'
    ctx.fillRect(0, 0, width, height)

    // Draw Coordinate Grid Lines
    drawCoordinateGrid(ctx, centerX, centerY, width, height, currentZoom)

    // Prepare Image Subtraction / Stacking modes background context
    if (mode === 'diff') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)'
      ctx.fillRect(0, 0, width, height)
    }

    const currentEpochVal = currentEpoch
    const t = PRESET_TARGETS[target.key] || PRESET_TARGETS.wise0855

    // Render Stars & Objects
    const stars = canvasRef.current ? canvasRef.current['starsSeed'] : []
    // If stars not pre-rendered, generate them
    if (!stars.length) {
      generateStarfield(ctx, width, height, t)
    }

    stars.forEach((star: any) => {
      let posX = centerX + star.x * currentZoom
      let posY = centerY + star.y * currentZoom

      // Handle Proper Motion / Epoch Displacement for Primary Target
      if (star.isPrimaryTarget) {
        const pmX = (star.properMotion.ra * currentEpochVal * 18 * currentZoom)
        const pmY = (star.properMotion.dec * currentEpochVal * 18 * currentZoom)
        posX += pmX
        posY += pmY
      }

      // Variable Star Pulsation Simulation
      let currentMag = star.mag
      if (star.isVariable) {
        currentMag += Math.sin((currentEpochVal * Math.PI / 1.5) + star.x) * 1.8
      }

      const radius = Math.max(1.5, (6 - currentMag) * 1.8 * currentZoom)

      // Render based on mode
      if (mode === 'diff') {
        // Difference Imaging Mode: Transient residuals highlight
        if (star.isPrimaryTarget && currentEpochVal > 0) {
          // Past position ghost (Blue)
          ctx.beginPath()
          ctx.arc(centerX + star.x * currentZoom, centerY + star.y * currentZoom, radius + 2, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(0, 243, 255, 0.8)'
          ctx.fill()

          // Current position shift (Red)
          ctx.beginPath()
          ctx.arc(posX, posY, radius + 2, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255, 75, 75, 0.9)'
          ctx.fill()
        } else {
          // Stationary star background cancels out in difference image
          ctx.beginPath()
          ctx.arc(posX, posY, radius * 0.6, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(148, 163, 184, 0.25)'
          ctx.fill()
        }
      } else if (mode === 'rgb') {
        // RGB False-Color Composite
        ctx.beginPath()
        ctx.arc(posX, posY, radius * 1.2, 0, Math.PI * 2)
        ctx.fillStyle = star.isPrimaryTarget ? `hsl(${ (selectedBand / 102) * 280 }, 80%, 60%)` : star.color
        ctx.shadowBlur = 12
        ctx.shadowColor = `hsl(${ (selectedBand / 102) * 280 }, 100%, 50%)`
        ctx.fill()
        ctx.shadowBlur = 0
      } else {
        // Standard Time Series View & Stack Mode
        ctx.beginPath()
        ctx.arc(posX, posY, radius, 0, Math.PI * 2)
        ctx.fillStyle = star.isPrimaryTarget ? star.color : star.color
        ctx.fill()

        // Star Glow
        ctx.beginPath()
        ctx.arc(posX, posY, radius * 2.2, 0, Math.PI * 2)
        ctx.fillStyle = star.isPrimaryTarget ? 'rgba(0, 243, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'
        ctx.fill()

        // Binary Pair extra point
        if (star.isBinary) {
          ctx.beginPath()
          ctx.arc(posX + (14 * currentZoom), posY - (10 * currentZoom), radius * 0.8, 0, Math.PI * 2)
          ctx.fillStyle = '#9d4edd'
          ctx.fill()
        }
      }

      // OVERLAY 1: Gaia DR3 Proper Motion Vectors
      if (overlays.gaia && (star.isPrimaryTarget || star.gaiaPm)) {
        const vectorX = (star.properMotion ? star.properMotion.ra : star.gaiaPm.x) * 12 * currentZoom
        const vectorY = (star.properMotion ? star.properMotion.dec : star.gaiaPm.y) * 12 * currentZoom

        ctx.beginPath()
        ctx.moveTo(posX, posY)
        ctx.lineTo(posX + vectorX, posY + vectorY)
        ctx.strokeStyle = '#34d399'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Arrow tip
        ctx.beginPath()
        ctx.arc(posX + vectorX, posY + vectorY, 2, 0, Math.PI * 2)
        ctx.fillStyle = '#34d399'
        ctx.fill()
      }

      // OVERLAY 2: WISE AllWISE IR Catalog Rings
      if (overlays.wise) {
        ctx.beginPath()
        ctx.arc(posX, posY, radius + (6 * currentZoom), 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255, 183, 3, 0.4)'
        ctx.lineWidth = 1
        ctx.setLineDash([2, 3])
        ctx.stroke()
        ctx.setLineDash([])
      }

      // OVERLAY 3: Simbad Object Labels
      if (overlays.simbad && (star.isPrimaryTarget || star.simbadName)) {
        ctx.font = '10px JetBrains Mono, monospace'
        ctx.fillStyle = star.isPrimaryTarget ? '#00f3ff' : '#94a3b8'
        ctx.fillText(star.isPrimaryTarget ? `${t.name} (${t.type})` : star.simbadName, posX + radius + 6, posY + 3)
      }
    })

    // Target Scope Reticle Center
    if (mode !== 'diff') {
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, 24, 0, Math.PI * 2)
      ctx.stroke()
    }
  }), [canvasRef, target, currentEpoch, zoom, mode, selectedBand, selectedArray, overlays])

  // Generate starfield - deterministic pseudo-random based on target
  const generateStarfield = useCallback(((ctx: CanvasRenderingContext2D, width: number, height: number, t: any) => {
    const count = t.starCount || 80
    const stars: any[] = []

    // Seeded background stars
    for (let i = 0; i < count; i++) {
      const angle = (i * 137.5) * (Math.PI / 180)
      const radius = Math.sqrt(i / count) * (width * 0.45)

      stars.push({
        x: Math.cos(angle) * radius + (Math.sin(i * 99) * 40),
        y: Math.sin(angle) * radius + (Math.cos(i * 33) * 40),
        mag: 2 + (i % 5) * 1.2,
        color: i % 7 === 0 ? '#ffb703' : (i % 5 === 0 ? '#00f3ff' : '#ffffff'),
        gaiaPm: { x: (Math.sin(i) * 0.4), y: (Math.cos(i) * 0.4) },
        simbadName: i % 12 === 0 ? `TYC ${(2000 + i)}-${i}` : null,
        isPrimaryTarget: false
      })
    }

    // Primary Target Source
    stars.push({
      isPrimaryTarget: true,
      name: t.name,
      x: 0,
      y: 0,
      mag: t.isVariable ? 3.5 : 2.5,
      color: t.spectralType.includes('Y') ? '#9d4edd' : (t.spectralType.includes('M') ? '#ff6b6b' : '#00f3ff'),
      properMotion: t.properMotion,
      isBinary: t.isBinary,
      isVariable: t.isVariable,
      simbadName: t.simbadName
    })

    // Store on canvas ref for reuse
    ;(canvasRef.current as any)['starsSeed'] = stars
    return stars
  }), [])

  // Initial starfield generation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const t = PRESET_TARGETS[target.key] || PRESET_TARGETS.wise0855
    generateStarfield(ctx, canvas.width, canvas.height, t)
    drawCanvas()
  }, [target.key, generateStarfield])

  // Event listeners for canvas interactions
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let isDragging = false
    let dragStart = { x: 0, y: 0 }

    // Mousemove - cursor coords and dragging
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left - canvas.width / 2
      const y = e.clientY - rect.top - canvas.height / 2

      // Approximate RA / Dec conversion for display
      const raVal = (8 + (x / 500)).toFixed(2)
      const decVal = (-7 + (y / 500)).toFixed(2)
      // In a full app, we'd update a state variable for cursor coords
      // For now, just log or update a ref

      // Handle canvas dragging
      if (isDragging) {
        panOffset.x = e.clientX - dragStart.x
        panOffset.y = e.clientY - dragStart.y
        drawCanvas()
      }
    }

    // mousedown - start dragging
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true
      dragStart = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y }
    }

    // mouseup - stop dragging
    const handleMouseUp = () => {
      isDragging = false
    }

    // canvas click - log discovery candidate
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left - canvas.width / 2
      const y = e.clientY - rect.top - canvas.height / 2

      // Simple hit detection on target (center star)
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const distFromCenter = Math.sqrt(x * x + y * y)

      // If clicked near center, log as discovery
      if (distFromCenter < 40) {
        const t = PRESET_TARGETS[target.key] || PRESET_TARGETS.wise0855
        addDiscoveryLog({
          name: t.name,
          ra: t.raDeg ? `${t.raDeg.toFixed(3)}` : '0',
          dec: t.decDeg ? `${t.decDeg.toFixed(3)}` : '0',
          epoch: 2025.5 + currentEpoch * 0.5
        })
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('click', handleCanvasClick)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('click', handleCanvasClick)
    }
  }, [currentEpoch, panOffset, target.key, addDiscoveryLog])

  // Zoom/pan controls
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const zoomInBtn = document.getElementById('btnZoomIn') as HTMLButtonElement
    const zoomOutBtn = document.getElementById('btnZoomOut') as HTMLButtonElement
    const resetViewBtn = document.getElementById('btnResetView') as HTMLButtonElement

    zoomInBtn?.addEventListener('click', () => {
      onZoomIn()
      drawCanvas()
    })

    zoomOutBtn?.addEventListener('click', () => {
      onZoomOut()
      drawCanvas()
    })

    resetViewBtn?.addEventListener('click', () => {
      onResetView()
      drawCanvas()
    })
  }, [onZoomIn, onZoomOut, onResetView, drawCanvas])

  // Mode switcher
  useEffect(() => {
    const modeGroup = document.getElementById('modeGroup') as HTMLDivElement
    if (!modeGroup) return

    modeGroup.addEventListener('click', (e: MouseEvent) => {
      const btn = e.target.closest('.mode-btn') as HTMLButtonElement | null
      if (btn) {
        document.querySelectorAll('.mode-btn')?.forEach(b => {
          b.className = "mode-btn px-2.5 py-1 rounded text-xs font-medium text-slate-400 hover:text-slate-200"
        })
        btn.className = "mode-btn px-2.5 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
        onModeChange(btn.dataset.mode as 'standard' | 'diff' | 'stack' | 'rgb')
        drawCanvas()
      }
    })
  }, [onModeChange, drawCanvas])

  // Detector array buttons
  useEffect(() => {
    const arrayGroup = document.getElementById('arrayGroup') as HTMLDivElement | null
    if (!arrayGroup) return

    arrayGroup.addEventListener('click', (e: MouseEvent) => {
      const btn = e.target.closest('.array-btn') as HTMLButtonElement | null
      if (btn) {
        const arrNum = parseInt(btn.dataset.array)
        onArrayChange(arrNum)
        // Set band relative to array range
        const arrBands = [1, 18, 35, 52, 70, 88]
        onBandChange(arrBands[arrNum - 1])
        drawCanvas()
      }
    })
  }, [onArrayChange, onBandChange, drawCanvas])

  // Fine band slider
  useEffect(() => {
    const bandSlider = document.getElementById('bandSlider') as HTMLInputElement | null
    if (!bandSlider) return

    bandSlider.addEventListener('input', (e) => {
      const bandVal = parseInt(e.target.value)
      onBandChange(bandVal)
      drawCanvas()
    })
  }, [onBandChange, drawCanvas])

  // Epoch badges click
  useEffect(() => {
    const epochBadges = document.getElementById('epochBadges') as HTMLDivElement | null
    if (!epochBadges) return

    epochBadges.addEventListener('click', (e: MouseEvent) => {
      const badge = e.target.closest('.epoch-btn') as HTMLSpanElement | null
      if (badge) {
        const epochIdx = parseInt(badge.dataset.index)
        onEpochChange(epochIdx)
        drawCanvas()
      }
    })
  }, [onEpochChange, drawCanvas])

  // Play/pause button animation
  useEffect(() => {
    const playIcon = document.getElementById('playIcon') as HTMLElement | null
    if (!playIcon) return

    // Update icon based on isPlaying state from store
    // This is handled by the parent, but we can sync here
    const checkPlayState = () => {
      // The isPlaying state is managed by the store and parent component
      // We just ensure the UI reflects it
    }

    checkPlayState()
  }, [isPlaying])

  // HUD readouts update - epoch, SNR, parallax
  useEffect(() => {
    const hudTargetName = document.getElementById('hudTargetName') as HTMLSpanElement | null
    const hudSNR = document.getElementById('hudSNR') as HTMLSpanElement | null
    const hudParallax = document.getElementById('hudParallax') as HTMLSpanElement | null
    const epochReadout = document.getElementById('epochReadout') as HTMLSpanElement | null

    if (hudTargetName) hudTargetName.innerText = target.name
    if (hudSNR) hudSNR.innerText = target.snr
    if (hudParallax) hudParallax.innerText = target.parallax
    if (epochReadout) {
      const epochs = ['2025.5 (Obs 1)', '2026.0 (Obs 2)', '2026.5 (Obs 3)', '2027.0 (Obs 4)']
      epochReadout.innerText = epochs[currentEpoch]
    }
  }, [currentEpoch, target])

  // Array buttons active state
  useEffect(() => {
    document.querySelectorAll('.array-btn')?.forEach((btn) => {
      const arrNum = parseInt(btn.dataset.array)
      const isSelected = arrNum === selectedArray
      if (isSelected) {
        btn.className = "array-btn bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 p-1.5 rounded text-left transition hover:border-cyan-400"
      } else {
        btn.className = "array-btn bg-space-900 border border-space-border text-slate-400 p-1.5 rounded text-left transition hover:border-cyan-400"
      }
    })
  }, [selectedArray])

  // Band slider active state
  useEffect(() => {
    document.getElementById('bandSlider')?.setAttribute('value', selectedBand.toString())
  }, [selectedBand])

  return (
    <div className="bg-space-900 border border-space-border rounded-xl p-3 flex flex-col relative shadow-xl">
      {/* Canvas Overlay Tools & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 bg-space-950/70 p-2 rounded-lg border border-space-border text-xs">
        {/* Mode Switcher Buttons */}
        <div className="flex items-center space-x-1 bg-space-900 p-1 rounded-lg border border-space-border" id="modeGroup">
          <button data-mode="standard" className={mode === 'standard' ? "mode-btn px-2.5 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "mode-btn px-2.5 py-1 rounded text-xs font-medium text-slate-400 hover:text-slate-200"} >Standard</button>
          <button data-mode="diff" className={mode === 'diff' ? "mode-btn px-2.5 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "mode-btn px-2.5 py-1 rounded text-xs font-medium text-slate-400 hover:text-slate-200"} >Difference Imaging</button>
          <button data-mode="stack" className={mode === 'stack' ? "mode-btn px-2.5 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "mode-btn px-2.5 py-1 rounded text-xs font-medium text-slate-400 hover:text-slate-200"} >Stacked (Co-add)</button>
          <button data-mode="rgb" className={mode === 'rgb' ? "mode-btn px-2.5 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "mode-btn px-2.5 py-1 rounded text-xs font-medium text-slate-400 hover:text-slate-200"} >RGB False-Color</button>
        </div>

        {/* Display Readouts */}
        <div className="flex items-center space-x-4 font-mono text-[11px] text-slate-300">
          <div>Epoch: <span id="epochReadout" className="text-cyan-400 font-bold">{['2025.5 (Obs 1)', '2026.0 (Obs 2)', '2026.5 (Obs 3)', '2027.0 (Obs 4)'][currentEpoch]}</span></div>
          <div className="hidden sm:block">Mode: <span className="text-amber-400">{mode}</span></div>
        </div>
      </div>

      {/* Canvas Visual Container */}
      <div className="relative w-full aspect-video max-h-[560px] bg-black rounded-lg overflow-hidden border border-space-border group shadow-inner">
        <canvas ref={canvasRef} id="skyCanvas" className="w-full h-full cursor-crosshair"></canvas>

        {/* Reticle & Inspection Overlay */}
        <div id="canvasHud" className="absolute bottom-3 left-3 bg-space-950/85 backdrop-blur-md px-3 py-2 rounded-lg border border-space-border font-mono text-[11px] space-y-1 text-slate-300 pointer-events-none">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Target: <strong id="hudTargetName" class="text-white">{target.name}</strong></span>
          </div>
          <div>Signal/Noise: <span id="hudSNR" className="text-emerald-400 font-bold">{target.snr}</span></div>
          <div>Est. Parallax: <span id="hudParallax" className="text-violet-400 font-bold">{target.parallax}</span></div>
        </div>

        {/* Canvas Interactive Controls Overlay */}
        <div className="absolute top-3 right-3 flex flex-col space-y-1.5">
          <button id="btnZoomIn" title="Zoom In" className="w-8 h-8 rounded-lg bg-space-900/80 border border-space-border hover:border-cyan-400 text-slate-200 flex items-center justify-center backdrop-blur transition"><i className="fa-solid fa-plus"></i></button>
          <button id="btnZoomOut" title="Zoom Out" className="w-8 h-8 rounded-lg bg-space-900/80 border border-space-border hover:border-cyan-400 text-slate-200 flex items-center justify-center backdrop-blur transition"><i className="fa-solid fa-minus"></i></button>
          <button id="btnResetView" title="Reset View" className="w-8 h-8 rounded-lg bg-space-900/80 border border-space-border hover:border-cyan-400 text-slate-200 flex items-center justify-center backdrop-blur transition"><i className="fa-solid fa-rotate-left"></i></button>
        </div>

        {/* Selected Target Highlight Badge (Floating)}}
        <div id="targetBadge" className="absolute top-3 left-3 bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 px-3 py-1 rounded-full text-xs font-mono flex items-center space-x-2">
          <i className="fa-solid fa-circle-dot text-cyan-400 animate-pulse"></i>
          <span id="targetBadgeText">{target.name} ({target.type})</span>
        </div>
      </div>

      {/* Time-Lapse Blink Controls Bar */}
      <div className="mt-3 bg-space-950 p-3 rounded-lg border border-space-border flex flex-wrap items-center justify-between gap-3">

        {/* Animation Playback Controls */}
        <div className="flex items-center space-x-2">
          <button id="btnPrevFrame" className="w-8 h-8 rounded-lg bg-space-800 hover:bg-space-700 text-slate-200 flex items-center justify-center transition border border-space-border">
            <i className="fa-solid fa-backward-step"></i>
          </button>
          <button id="btnPlayPause" className="w-9 h-9 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold flex items-center justify-center transition shadow-md shadow-cyan-500/20">
            <i id="playIcon" className="fa-solid fa-play"></i>
          </button>
          <button id="btnNextFrame" className="w-8 h-8 rounded-lg bg-space-800 hover:bg-space-700 text-slate-200 flex items-center justify-center transition border border-space-border">
            <i className="fa-solid fa-forward-step"></i>
          </button>
          <span className="text-xs font-mono text-slate-400 ml-2">Blink Speed:</span>
          <input type="range" id="speedSlider" min="1" max="8" value={fps} className="w-20 h-1.5 bg-space-800 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
          <span id="speedVal" className="text-xs font-mono text-cyan-400 font-bold">{fps} FPS</span>
        </div>

        {/* Epoch Timeline Slider */}
        <div className="flex-1 min-w-[200px] flex items-center space-x-3">
          <span className="text-xs font-mono text-slate-400">Epoch:</span>
          <input type="range" id="epochSlider" min="0" max="3" step="1" value={currentEpoch} className="w-full h-2 bg-space-800 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
        </div>

        {/* Epoch Badges */}
        <div className="flex items-center space-x-1 font-mono text-[11px]" id="epochBadges">
          <span className={currentEpoch === 0 ? "px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-pointer epoch-btn" : "px-2 py-0.5 rounded bg-space-800 text-slate-400 hover:text-slate-200 cursor-pointer epoch-btn"} data-index={0}>2025.5</span>
          <span className={currentEpoch === 1 ? "px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-pointer epoch-btn" : "px-2 py-0.5 rounded bg-space-800 text-slate-400 hover:text-slate-200 cursor-pointer epoch-btn"} data-index={1}>2026.0</span>
          <span className={currentEpoch === 2 ? "px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-pointer epoch-btn" : "px-2 py-0.5 rounded bg-space-800 text-slate-400 hover:text-slate-200 cursor-pointer epoch-btn"} data-index={2}>2026.5</span>
          <span className={currentEpoch === 3 ? "px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-pointer epoch-btn" : "px-2 py-0.5 rounded bg-space-800 text-slate-400 hover:text-slate-200 cursor-pointer epoch-btn"} data-index={3}>2027.0</span>
        </div>
      </div>

      {/* 102 Band Multi-Spectral Array Selector Bar */}
      <div className="mt-3 bg-space-950 p-3 rounded-lg border border-space-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
            <i className="fa-solid fa-wave-square text-violet-400"></i>
            <span className="font-bold text-white">SPHEREx 102 Spectral Bands Array</span>
            <span className="text-slate-400">(Selected: <span id="currentBandWavelength" className="text-cyan-400 font-bold">Band {selectedBand} / {((0.75 + (selectedBand / 102) * 4.25).toFixed(2))} µm</span>)</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">Array 1 - 6 Coverage: 0.75µm to 5.00µm</div>
        </div>

        {/* Detector Arrays Switcher buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 text-xs font-mono">
          {SPHEREX_ARRAYS.map((arr, i) => (
            <button key={arr.id} data-array={arr.id} className={selectedArray === arr.id ? "array-btn bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 p-1.5 rounded text-left transition hover:border-cyan-400" : "array-btn bg-space-900 border border-space-border text-slate-400 p-1.5 rounded text-left transition hover:border-cyan-400"}>
              <div className="font-bold text-[11px]">{arr.label}</div>
              <div className="text-[10px] opacity-75">{arr.wavelengthRange}</div>
            </button>
          ))}
        </div>

        {/* Fine Band Slider */}
        <div className="flex items-center space-x-3 pt-1">
          <span className="text-xs font-mono text-slate-400">Fine Band Tuning (1-102):</span>
          <input type="range" id="bandSlider" min="1" max={TOTAL_BAND_COUNT} value={selectedBand} className="w-full h-2 bg-space-800 rounded-lg appearance-none cursor-pointer accent-violet-400" />
        </div>
      </div>
    </div>
  )
}

export default SkyViewerCanvas