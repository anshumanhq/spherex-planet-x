/**
 * Type definitions for the Planet X & SPHEREx Viewer application.
 * Converted from the single-file HTML prototype to modular TypeScript.
 */

/** Preset celestial target data model */
export interface PresetTarget {
  key: string
  name: string
  type: string
  ra: string        // HH:MM:SS format
  dec: string       // DD:MM:SS format
  raDeg: number     // Decimal degrees
  decDeg: number    // Decimal degrees
  fov: number       // Field of view in degrees
  properMotion: {
    ra: number      // arcsec/year RA shift
    dec: number     // arcsec/year Dec shift
  }
  parallax: string  // arcseconds
  snr: string
  conf: string
  starCount: number
  isBinary?: boolean
  isVariable?: boolean
  spectralType?: string
  features?: string[]
  sedSpectrum: number[]  // Flux values across 12 SPHEREx bands
}

/** Application state managed by Zustand store */
export interface AppState {
  targetKey: string
  ra: string
  dec: string
  fov: number
  currentEpoch: number  // 0-3, corresponding to 2025.5-2027.0
  isPlaying: boolean
  fps: number
  selectedBand: number  // 1-102
  selectedArray: number  // 1-6
  mode: 'standard' | 'diff' | 'stack' | 'rgb'
  zoom: number
  panOffset: { x: number; y: number }
  overlays: {
    gaia: boolean
    wise: boolean
    simbad: boolean
  }
  discoveryLogs: DiscoveryLogEntry[]
  starsSeed: StarData[]
}

/** Individual discovery log entry */
export interface DiscoveryLogEntry {
  name: string
  ra: string
  dec: string
  epoch: number
  timestamp: string
}

/** Star rendering data for canvas */
export interface StarData {
  x: number
  y: number
  mag: number
  color: string
  isPrimaryTarget: boolean
  properMotion: { ra: number; dec: number }
  isBinary?: boolean
  isVariable?: boolean
  simbadName?: string
  gaiaPm?: { x: number; y: number }
}

/** URL parameters for share/embed synchronization */
export interface UrlParameters {
  target?: string
  ra?: string
  dec?: string
  fov?: string
  band?: string
  mode?: string
}

/** SED chart data point */
export interface SedDataPoint {
  wavelength: number  // in micrometers
  flux: number        // in mJy
}

/** Molecular absorption band template */
export interface MolecularBand {
  name: string        // e.g., "H2O", "CO2", "CO", "CH4"
  wavelengths: number[]  // wavelength ranges in µm where absorption occurs
  color: string       // overlay color
  opacity: number     // 0-1
}