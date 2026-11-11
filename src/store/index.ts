/**
 * Zustand store for SPHEREx Planet X.
 * Exports the store as `useAppStore` with `.getState()` access.
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AppState, UrlParameters, SedDataPoint, MolecularBand } from '../types'

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
  overlays: { gaia: true, wise: true, simbad: true },
  discoveryLogs: [],
  starsSeed: [],
}

const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setTarget: (targetKey: string) => set({ targetKey }),
      setCoordinates: (ra: string, dec: string) => set({ ra, dec }),

      setEpoch: (epoch: number) => set({ currentEpoch: epoch }),
      togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
      setFPS: (fps: number) => set({ fps }),
      nextFrame: () => set((s) => ({ currentEpoch: (s.currentEpoch + 1) % 4, isPlaying: false })),
      prevFrame: () => set((s) => ({ currentEpoch: (s.currentEpoch - 1 + 4) % 4, isPlaying: false })),

      setSelectedBand: (band: number) => set({ selectedBand: band }),
      setSelectedArray: (array: number) => set({ selectedArray: array }),
      setBandFromArray: (arrayIndex: number, bandIndex: number) =>
        set({ selectedArray: arrayIndex + 1, selectedBand: bandIndex }),

      setMode: (mode: 'standard' | 'diff' | 'stack' | 'rgb') => set({ mode }),

      zoomIn: () => set((s) => ({ zoom: Math.min(3.0, s.zoom + 0.2) })),
      zoomOut: () => set((s) => ({ zoom: Math.max(0.5, s.zoom - 0.2) })),
      resetView: () => set({ zoom: 1.0, panOffset: { x: 0, y: 0 } }),
      setPanOffset: (offset: { x: number; y: number }) => set({ panOffset: offset }),

      toggleOverlay: (overlay: 'gaia' | 'wise' | 'simbad') =>
        set((s) => ({
          overlays: { ...s.overlays, [overlay]: !s.overlays[overlay] },
        })),

      addDiscoveryLog: (entry: { name: string; ra: string; dec: string; epoch: number }) =>
        set((s) => ({
          discoveryLogs: [...s.discoveryLogs, { ...entry, timestamp: new Date().toLocaleTimeString() }],
        })),
      clearDiscoveryLog: () => set({ discoveryLogs: [] }),

      setUrlParameter: (key: keyof UrlParameters, value: string) => set({ [key]: value } as any),
      setFOV: (fov: number) => set({ fov }),

      setSedData: (data: SedDataPoint[]) => set({ sedData: data } as any),
      setMolecularBands: (bands: MolecularBand[]) => set({ molecularBands: bands } as any),

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'spherex-viewer-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ── Named exports ────────────────────────────────────
// The hook itself (supports both useAppStore(selector) and useAppStore.getState())
export const useAppStore = useStore

// Convenience selectors
export const useTargetState = () =>
  useStore((s) => ({ targetKey: s.targetKey, ra: s.ra, dec: s.dec }))

export const useViewerState = () =>
  useStore((s) => ({
    fov: s.fov,
    currentEpoch: s.currentEpoch,
    isPlaying: s.isPlaying,
    fps: s.fps,
    selectedBand: s.selectedBand,
    selectedArray: s.selectedArray,
    mode: s.mode,
    zoom: s.zoom,
  }))

export const useOverlayState = () => useStore((s) => ({ overlays: s.overlays }))
export const useDiscoveryState = () => useStore((s) => ({ discoveryLogs: s.discoveryLogs }))

// Named action exports (for direct import like `import { addDiscoveryLog } from '@/store'`)
export const addDiscoveryLog = (entry: { name: string; ra: string; dec: string; epoch: number }) =>
  useStore.getState().addDiscoveryLog(entry)
export const clearDiscoveryLog = () => useStore.getState().clearDiscoveryLog()

export default useStore