/**
 * Pre-loaded Quick-Load Presets converted from the original HTML prototype.
 * Supports Equatorial Coordinates (RA: 0-360° or HH:MM:SS, Dec: -90 to +90° or DD:MM:SS)
 * and target name resolution for the Target Navigation & Query Engine.
 */

import type { PresetTarget } from '../types'

/** Preset Celestial Target Catalog Database */
export const PRESET_TARGETS: Record<string, PresetTarget> = {
  wise0855: {
    key: 'wise0855',
    name: 'WISE 0855',
    type: 'Fast Brown Dwarf (Sub-Zero)',
    ra: '08h 55m 10.83s',
    dec: '-07° 14\' 42.53"',
    raDeg: 133.795,
    decDeg: -7.245,
    fov: 0.5,
    properMotion: { ra: -8.1, dec: -0.7 }, // arcsec / year shift
    parallax: '0.396"',
    snr: '42.8 σ',
    conf: '99.4% (High)',
    starCount: 65,
    features: ['Water Ice Clouds', 'Methane Absorption Band'],
    spectralType: 'Y-Dwarf',
    sedSpectrum: [2, 3, 5, 12, 45, 80, 95, 85, 40, 20, 10, 5] // Flux values across arrays
  },
  barnards: {
    key: 'barnards',
    name: "Barnard's Star",
    type: 'High Proper Motion Red Dwarf',
    ra: '17h 57m 48.50s',
    dec: '+04° 41\' 36.20"',
    raDeg: 269.452,
    decDeg: 4.693,
    fov: 0.6,
    properMotion: { ra: -0.8, dec: 10.3 },
    parallax: '0.547"',
    snr: '128.4 σ',
    conf: '99.9% (Very High)',
    starCount: 85,
    features: ['Strong Red Infrared Continuum', 'High Motion Vector'],
    spectralType: 'M4.0V',
    sedSpectrum: [80, 92, 95, 88, 70, 55, 40, 30, 22, 18, 12, 8]
  },
  epsIndiB: {
    key: 'epsIndiB',
    name: 'Epsilon Indi B',
    type: 'Binary Brown Dwarf System',
    ra: '22h 04m 10.52s',
    dec: '-56° 46' 58.00"',
    raDeg: 331.043,
    decDeg: -56.782,
    fov: 0.4,
    properMotion: { ra: 4.1, dec: -2.5 },
    parallax: '0.275"',
    snr: '64.2 σ',
    conf: '98.7%',
    starCount: 50,
    isBinary: true,
    features: ['T1 + T6 Binary Pair', 'Strong CH4 & H2O dips'],
    spectralType: 'T1 / T6',
    sedSpectrum: [15, 25, 40, 75, 90, 60, 30, 45, 25, 15, 10, 5]
  },
  rwAur: {
    key: 'rwAur',
    name: 'RW Aurigae',
    type: 'T Tauri Variable Star System',
    ra: '05h 07m 49.54s',
    dec: '+30° 24\' 05.10"',
    raDeg: 76.956,
    decDeg: 30.401,
    fov: 0.5,
    properMotion: { ra: 0.1, dec: -0.2 },
    parallax: '0.006"',
    snr: '88.1 σ',
    conf: '97.5%',
    starCount: 110,
    isVariable: true,
    features: ['Accretion Disk Flaring', 'Stray Dust Obscuration'],
    spectralType: 'K3e',
    sedSpectrum: [50, 65, 80, 90, 85, 75, 95, 70, 60, 50, 40, 35]
  },
  rDra: {
    key: 'rDra',
    name: 'R Draconis',
    type: 'Mira Pulsating Variable Star',
    ra: '16h 32m 40.20s',
    dec: '+66° 45\' 18.00"',
    raDeg: 248.167,
    decDeg: 66.755,
    fov: 0.5,
    properMotion: { ra: -0.3, dec: 0.4 },
    parallax: '0.003"',
    snr: '105.0 σ',
    conf: '98.9%',
    starCount: 75,
    isVariable: true,
    features: ['Pulsating Brightness (3-4 Mag delta)', 'Infrared Excess'],
    spectralType: 'M5e - M8e',
    sedSpectrum: [30, 45, 60, 80, 100, 90, 70, 50, 35, 25, 18, 12]
  },
  planetX: {
    key: 'planetX',
    name: 'Hypothetical Planet X / Kuiper Candidate',
    type: 'Slow Trans-Neptunian Candidate',
    ra: '03h 22m 15.00s',
    dec: '+12° 08\' 30.00"',
    raDeg: 50.562,
    decDeg: 12.141,
    fov: 0.8,
    properMotion: { ra: -1.8, dec: -0.6 },
    parallax: '0.120"',
    snr: '18.4 σ',
    conf: '82.1% (Candidate)',
    starCount: 130,
    isPlanetX: true,
    features: ['Extreme Parallax Vector', 'Faint Thermal Signature'],
    spectralType: 'TBO Candidate',
    sedSpectrum: [1, 2, 4, 8, 18, 32, 50, 42, 28, 16, 8, 4]
  }
}

/** Quick-Load Preset list for UI dropdown (matches original HTML order) */
export const QUICK_LOAD_PRESETS = [
  'wise0855',
  'barnards',
  'epsIndiB',
  'rwAur',
  'rDra',
  'planetX'
]

/** SPHEREx detector arrays configuration */
export const SPHEREX_ARRAYS = [
  { id: 1, label: 'Array 1', wavelengthRange: '0.75-1.11µm', bandCount: 18 },
  { id: 2, label: 'Array 2', wavelengthRange: '1.11-1.64µm', bandCount: 17 },
  { id: 3, label: 'Array 3', wavelengthRange: '1.64-2.42µm', bandCount: 17 },
  { id: 4, label: 'Array 4', wavelengthRange: '2.42-3.82µm', bandCount: 16 },
  { id: 5, label: 'Array 5', wavelengthRange: '3.82-4.42µm', bandCount: 14 },
  { id: 6, label: 'Array 6', wavelengthRange: '4.42-5.00µm', bandCount: 14 }
]

/** Total SPHEREx bands */
export const TOTAL_BAND_COUNT = 102

/** Band center wavelengths (approximate, evenly spaced across 0.75-5.0µm) */
export const BAND_CENTER_WAVELENGTHS = (() => {
  const wavelengths: number[] = []
  const minWave = 0.75 // µm
  const maxWave = 5.00 // µm
  const step = (maxWave - minWave) / (TOTAL_BAND_COUNT - 1)
  
  for (let i = 0; i < TOTAL_BAND_COUNT; i++) {
    wavelengths.push(parseFloat((minWave + i * step).toFixed(2)))
  }
  return wavelengths
})()

/** Array band boundaries - which band index each array starts at (1-indexed) */
export const ARRAY_BAND_STARTS = [1, 18, 35, 52, 70, 88] // Array 1 starts at band 1, Array 2 at band 18, etc.

/** Molecular absorption band templates for SED overlay */
export const MOLECULAR_BANDS: Array<{
  name: string
  wavelengths: number[]
  color: string
  opacity: number
}> = [
  {
    name: 'H2O',
    wavelengths: [1.4, 1.9], // µm - strong water absorption bands
    color: '#00f3ff',
    opacity: 0.3
  },
  {
    name: 'CH4',
    wavelengths: [2.3, 3.3], // µm - methane absorption bands
    color: '#9d4edd',
    opacity: 0.3
  },
  {
    name: 'CO2',
    wavelengths: [4.2], // µm - carbon dioxide absorption
    color: '#ffb703',
    opacity: 0.3
  },
  {
    name: 'CO',
    wavelengths: [4.6], // µm - carbon monoxide absorption
    color: '#00d4aa',
    opacity: 0.3
  }
]