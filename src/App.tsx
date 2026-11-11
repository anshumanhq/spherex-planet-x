/**
 * Main Application — SPHEREx Planet X
 * Layout:
 *   1. Header (branding + live status)
 *   2. LiveDataPanel (real NASA data + AI analysis)  ← full width
 *   3. Design vision components (canvas viewer, SED, catalogs, etc.)
 *   4. Footer
 */
import { useEffect } from 'react'
import useAppStore from '@/store'
import { PRESET_TARGETS, QUICK_LOAD_PRESETS, SPHEREX_ARRAYS, TOTAL_BAND_COUNT, BAND_CENTER_WAVELENGTHS, MOLECULAR_BANDS } from '@/constants/presets'
import { useTargetState, useViewerState, useOverlayState, useDiscoveryState } from '@/store'

import Header from '@/components/Header'
import LiveDataPanel from '@/components/LiveDataPanel'
import TargetNavigator from '@/components/TargetNavigator'
import SkyViewerCanvas from '@/components/SkyViewerCanvas'
import BandSelector from '@/components/BandSelector'
import SEDChart from '@/components/SEDChart'
import CatalogOverlays from '@/components/CatalogOverlays'
import MetadataPanel from '@/components/MetadataPanel'
import DiscoveryLog from '@/components/DiscoveryLog'
import ShareModal from '@/components/ShareModal'
import Footer from '@/components/Footer'

function App() {
  const { targetKey, ra, dec } = useTargetState()
  const { fov, currentEpoch, isPlaying, fps, selectedBand, selectedArray, mode, zoom } = useViewerState()
  const { overlays } = useOverlayState()
  const { discoveryLogs } = useDiscoveryState()

  const {
    setTarget, setCoordinates, setEpoch, togglePlay, setFPS, nextFrame, prevFrame,
    setSelectedBand, setSelectedArray, setMode, zoomIn, zoomOut, resetView, toggleOverlay,
    addDiscoveryLog, clearDiscoveryLog, setUrlParameter, setFOV,
  } = useAppStore.getState()

  const target = PRESET_TARGETS[targetKey] || PRESET_TARGETS.wise0855

  // Sync URL params → store on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('target') && PRESET_TARGETS[params.get('target')!]) {
      setTarget(params.get('target') || 'wise0855')
    }
    if (params.has('ra')) setCoordinates(params.get('ra') || ra, params.get('dec') || dec)
    if (params.has('fov')) setFOV(parseFloat(params.get('fov')) || 0.5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 font-mono">
      <Header />

      <main className="flex-1 max-w-[1800px] w-full mx-auto p-3 lg:p-4 space-y-4">

        {/* ═══════════════════════════════════════════════════ */}
        {/* LIVE REAL DATA PANEL — full width, includes AI     */}
        {/* ═══════════════════════════════════════════════════ */}
        <LiveDataPanel />

        {/* ═══════════════════════════════════════════════════ */}
        {/* DESIGN VISION — interactive mockup components      */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 border-t border-slate-800">
          <div className="lg:col-span-12 mb-2">
            <h2 className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              ▸ Design Vision — SPHEREx SkyExplorer UI
            </h2>
          </div>

          {/* LEFT: controls + canvas */}
          <div className="lg:col-span-8 flex flex-col space-y-3">
            <TargetNavigator
              targetKey={targetKey}
              ra={ra}
              dec={dec}
              onTargetChange={setTarget}
              onCoordinatesChange={setCoordinates}
              quickLoadPresets={QUICK_LOAD_PRESETS}
              onFovChange={(val: number) => setFOV(val)}
            />

            <SkyViewerCanvas
              target={target}
              fov={fov}
              currentEpoch={currentEpoch}
              isPlaying={isPlaying}
              fps={fps}
              selectedBand={selectedBand}
              selectedArray={selectedArray}
              mode={mode}
              zoom={zoom}
              panOffset={{ x: 0, y: 0 }}
              onEpochChange={setEpoch}
              onTogglePlay={togglePlay}
              onSetFPS={setFPS}
              onNextFrame={nextFrame}
              onPrevFrame={prevFrame}
              onBandChange={setSelectedBand}
              onArrayChange={setSelectedArray}
              onModeChange={setMode}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onResetView={resetView}
              onAddDiscovery={addDiscoveryLog}
              onToggleOverlay={toggleOverlay}
            />
          </div>

          {/* RIGHT: analytics panels */}
          <div className="lg:col-span-4 flex flex-col space-y-3">
            <SEDChart
              target={target}
              selectedBand={selectedBand}
              selectedArray={selectedArray}
              bands={MOLECULAR_BANDS}
            />

            <BandSelector
              arrays={SPHEREX_ARRAYS}
              totalBands={TOTAL_BAND_COUNT}
              selectedBand={selectedBand}
              selectedArray={selectedArray}
              onBandChange={setSelectedBand}
              onArrayChange={setSelectedArray}
            />

            <CatalogOverlays
              overlays={overlays}
              onToggleGaia={(key, value) => toggleOverlay(key)}
              onToggleWise={(key, value) => toggleOverlay(key)}
              onToggleSimbad={(key, value) => toggleOverlay(key)}
            />

            <MetadataPanel
              target={target}
              selectedBand={selectedBand}
              selectedArray={selectedArray}
            />

            <DiscoveryLog
              logs={discoveryLogs}
              onClear={clearDiscoveryLog}
            />

            <ShareModal
              target={target}
              ra={ra}
              dec={dec}
              fov={fov}
              selectedBand={selectedBand}
              onCopyUrl={() => {
                navigator.clipboard.writeText(window.location.href)
              }}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default App