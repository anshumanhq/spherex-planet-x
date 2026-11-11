/**
 * Zustand store for managing Planet X & SPHEREx Viewer application state.
 * Replaces the original global AppState object with a proper store.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AppState, PresetTarget, UrlParameters, SedDataPoint, MolecularBand } from '../src/types'

/**
 * Initial state derived from the original HTML prototype's AppState.
 * Preset targets database (moved to constants module for separation of concerns).
 */
const initialState: AppState = {
  targetKey: 'wise0855',
  ra: '08h 55m 10.83s',
  dec: '-07° 14\' 42.53"',
  fov: 0.5,
  currentEpoch: 0,
  isPlaying: false,
  fps: 3,
  selectedBand: 42,
  selectedArray: 3,
  mode: 'standard',
  zoom: 1.0,
  panOffset: { x: 0, y: 0 },
  overlays: {
    gaia: true,
    wise: true,
    simbad: true
  },
  discoveryLogs: [],
  starsSeed: []
}

/**
 * Persisted storage adapter for Zustand.
 * Saves/loads state to localStorage while preserving the dark theme preference.
 */
const useStore = create<AppState>(
  persist(
    (set, get) => ({
      ...initialState,

      // ---- Target Navigation Actions ----

      setTarget: (targetKey: string) => {
        set({ targetKey })
        // Update RA/Dec based on preset (would normally query from server)
        // In the modular version, this is handled by the TargetNavigator component
      },

      setCoordinates: (ra: string, dec: string) => {
        set({ ra, dec })
      },

      // ---- Epoch Playback Actions ----

      setEpoch: (epoch: number) => {
        set({ currentEpoch: epoch })
      },

      togglePlay: () => {
        set((state) => ({
          isPlaying: !state.isPlaying
        }))
      },

      setFPS: (fps: number) => {
        set({ fps })
        // Restart animation loop with new FPS
        // Handled by the UI component that calls this
      },

      nextFrame: () => {
        set((state) => ({
          currentEpoch: (state.currentEpoch + 1) % 4,
          isPlaying: false
        }))
      },

      prevFrame: () => {
        set((state) => ({
          currentEpoch: (state.currentEpoch - 1 + 4) % 4,
          isPlaying: false
        }))
      },

      // ---- Band/Array Selection Actions ----

      setSelectedBand: (band: number) => {
        set({ selectedBand: band })
      },

      setSelectedArray: (array: number) => {
        set({ selectedArray: array })
      },

      // Calculate band from array (6 arrays, ~17 bands each)
      setBandFromArray: (arrayIndex: number, bandIndex: number) => {
        set({
          selectedArray: arrayIndex + 1,
          selectedBand: bandIndex
        })
      },

      // ---- Viewer Mode Actions ----

      setMode: (mode: 'standard' | 'diff' | 'stack' | 'rgb') => {
        set({ mode })
      },

      // ---- Zoom/Pan Actions ----

      zoomIn: () => {
        set((state) => ({
          zoom: Math.min(3.0, state.zoom + 0.2)
        }))
      },

      zoomOut: () => {
        set((state) => ({
          zoom: Math.max(0.5, state.zoom - 0.2)
        }))
      },

      resetView: () => {
        set({
          zoom: 1.0,
          panOffset: { x: 0, y: 0 }
        })
      },

      setPanOffset: (offset: { x: number; y: number }) => {
        set({ panOffset: offset })
      },

      // ---- Overlay Toggles ----

      toggleOverlay: (overlay: 'gaia' | 'wise' | 'simbad') => {
        set((state) => ({
          overlays: {
            ...state.overlays,
            [overlay]: !state.overlays[overlay]
          }
        }))
      },

      // ---- Discovery Log Actions ----

      addDiscoveryLog: (entry: {
        name: string
        ra: string
        dec: string
        epoch: number
      }) => {
        set((state) => ({
          discoveryLogs: [
            ...state.discoveryLogs,
            {
              ...entry,
              timestamp: new Date().toLocaleTimeString()
            }
          ]
        }))
      },

      clearDiscoveryLog: () => {
        set({ discoveryLogs: [] })
      },

      // ---- URL Parameter Sync ----

      setUrlParameter: (key: keyof UrlParameters, value: string) => {
        set({
          [key]: value
        })
      },

      setFOV: (fov: number) => {
        set({ fov })
      },

      // ---- SED Chart Data ----

      setSedData: (data: SedDataPoint[]) => {
        set({ sedData: data })
      },

      // ---- Molecular Band Overlays ----

      setMolecularBands: (bands: MolecularBand[]) => {
        set({ molecularBands: bands })
      },

      // ---- Reset all state to initial ----

      reset: () => set({ ...initialState })
    }),
    {
      name: 'spherex-viewer-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)

export default useStore

// Helper selector hooks for convenient state access
export useAppStore = (selector: (state: AppState) => any) => {
  return useStore(selector)
}

// Convenience hooks for common state slices
export useTargetState = () => useStore(state => ({
  targetKey: state.targetKey,
  ra: state.ra,
  dec: state.dec
}))

export useViewerState = () => useStore(state => ({
  fov: state.fov,
  currentEpoch: state.currentEpoch,
  isPlaying: state.isPlaying,
  fps: state.fps,
  selectedBand: state.selectedBand,
  selectedArray: state.selectedArray,
  mode: state.mode,
  zoom: state.zoom
}))

export useOverlayState = () => useStore(state => ({
  overlays: state.overlays
}))

export useDiscoveryState = () => useStore(state => ({
  discoveryLogs: state.discoveryLogs
}))