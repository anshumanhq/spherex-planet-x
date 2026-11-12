/**
 * Main App — Header + LiveDataPanel + Design Vision + Footer + ShareModal.
 */
import { useEffect, useState } from 'react'
import useAppStore from '@/store'
import {
  PRESET_TARGETS, QUICK_LOAD_PRESETS, SPHEREX_ARRAYS, TOTAL_BAND_COUNT,
  MOLECULAR_BANDS,
} from '@/constants/presets'
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
    addDiscoveryLog, clearDiscoveryLog, setFOV,
  } = useAppStore.getState()

  const [shareOpen, setShareOpen] = useState(false)

  const target = PRESET_TARGETS[targetKey] || PRESET_TARGETS.wise0855

  // Sync URL params → mockup store on mount (design vision sync only)
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
      <Header onShareClick={() => setShareOpen(true)} />

      <main className="flex-1 max-w-[1800px] w-full mx-auto p-3 lg:p-4 space-y-4">
        {/* Live panel with real data + AI */}
        <LiveDataPanel />

        {/* Design Vision — mockup with interactive controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 border-t border-slate-800">
          <div className="lg:col-span-12 mb-2">
            <h2 className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              ▸ Design Vision — SPHEREx SkyExplorer UI
            </h2>
          </div>

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
              onExport={() => {
                if (discoveryLogs.length === 0) {
                  alert('No candidates logged yet! Click targets on the visualizer canvas first.')
                  return
                }
                let csv = 'Target,RA,Dec,Epoch,Timestamp\n'
                discoveryLogs.forEach((item: any) => {
                  csv += `"${item.name}","${item.ra}","${item.dec}","${item.epoch}","${item.timestamp || ''}"\n`
                })
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `spherex_candidates_${Date.now()}.csv`
                a.click()
                URL.revokeObjectURL(url)
              }}
            />
          </div>
        </div>
      </main>

      <Footer />

      {/* Global share modal — opens from Header */}
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  )
}

export default App