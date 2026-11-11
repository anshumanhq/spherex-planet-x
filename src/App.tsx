/**
 * Main Application Component
 * Root component that composes all UI modules for the Planet X & SPHEREx Viewer.
 * 
 * Architecture:
 - Uses Zustand store for global state management (coordinates, epoch, bands, overlays)
 - Tailwind CSS with dark mode for the astro-tech dark space theme
 - Lucide React icons for modern interface icons
 - Chart.js for SED spectral energy distribution plots
 - HTML5 Canvas API for astronomical image rendering
 */

import { useEffect } from 'react'
import useAppStore from '@/src/store'
import { PRESET_TARGETS, QUICK_LOAD_PRESETS, SPHEREX_ARRAYS, TOTAL_BAND_COUNT, BAND_CENTER_WAVELENGTHS, MOLECULAR_BANDS } from '@/src/constants/presets'
import { useTargetState, useViewerState, useOverlayState, useDiscoveryState } from '@/src/store'
import Header from '@/src/components/Header'
import TargetNavigator from '@/src/components/TargetNavigator'
import SkyViewerCanvas from '@/src/components/SkyViewerCanvas'
import BandSelector from '@/src/components/BandSelector'
import SEDChart from '@/src/components/SEDChart'
import CatalogOverlays from '@/src/components/CatalogOverlays'
import MetadataPanel from '@/src/components/MetadataPanel'
import DiscoveryLog from '@/src/components/DiscoveryLog'
import ShareModal from '@/src/components/ShareModal'

/**
 * Root App component.
 * Sets up the layout, subscribes to store updates, and renders all child components.
 */
function App() {
  // Initialize store state on mount - this reads from localStorage if persisted,
  // or uses the default initial state
  useEffect(() => {
    // No explicit init needed - Zustand persist middleware handles this
    // on first render via the create() call in the store
  }, [])

  // Derive commonly accessed state from the store via selectors
  const { targetKey, ra, dec } = useTargetState()
  const { fov, currentEpoch, isPlaying, fps, selectedBand, selectedArray, mode, zoom } = useViewerState()
  const { overlays } = useOverlayState()
  const { discoveryLogs } = useDiscoveryState()

  const { setTarget, setCoordinates, setEpoch, togglePlay, setFPS, nextFrame, prevFrame,
    setSelectedBand, setSelectedArray, setMode, zoomIn, zoomOut, resetView, toggleOverlay,
    addDiscoveryLog, clearDiscoveryLog, setUrlParameter, setFOV } = useAppStore.getState()

  // Compute derived values
  const target = PRESET_TARGETS[targetKey] || PRESET_TARGETS.wise0855
  const epochLabels = ['2025.5 (Obs 1)', '2026.0 (Obs 2)', '2026.5 (Obs 3)', '2027.0 (Obs 4)']

  // URL parameter sync: keep store in sync with URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // Sync target from URL if specified
    if (params.has('target') && PRESET_TARGETS[params.get('target')]) {
      setTarget(params.get('target') || 'wise0855')
    }
    // Sync coordinates
    if (params.has('ra')) setCoordinates(params.get('ra') || ra, params.get('dec') || dec)
    // Sync FOV
    if (params.has('fov')) setFOV(parseFloat(params.get('fov')) || 0.5)
  }, [targetKey, ra, dec, fov])

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 font-mono">
      <Header />
      <main class="flex-1 max-w-[1800px] w-full mx-auto p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* LEFT / TOP CONTROLS & MAIN VISUALIZER (Col 8/12 on LG) */}
        <div class="lg:col-span-8 flex flex-col space-y-3">
          <TargetNavigator
            targetKey={targetKey}
            ra={ra}
            dec={dec}
            onTargetChange={setTarget}
            onCoordinatesChange={setCoordinates}
            quickLoadPresets={QUICK_LOAD_PRESETS}
            onFovChange={(val: number) => {
              // Handle FOV change
              setUrlParameter('fov', val.toString())
              // Need to add setFOV to store or use setUrlParameter
            }}
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

        {/* RIGHT DATA & ANALYTICS PANEL (Col 4/12 on LG) */}
        <div class="lg:col-span-4 flex flex-col space-y-3">
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
            onToggleGaia={({ key, value }) => toggleOverlay(key as 'gaia')}
            onToggleWise={({ key, value }) => toggleOverlay(key as 'wise')}
            onToggleSimbad={({ key, value }) => toggleOverlay(key as 'simbad')}
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
            onCopyUrl={() => {/* handled internally */}
            }
          />
        </div>

      </main>
      <Footer />
    </div>
  )
}

export default App