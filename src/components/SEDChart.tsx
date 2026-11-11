/**
 * SED Chart Component
 * Dynamic plotting of flux vs. wavelength (0.75–5.0 µm) with interactive molecular
 * absorption band overlays (H2O, CO2, CO, CH4).
 * 
 * Uses Chart.js for the SED plot with responsive design and tooltips.
 * 
 * Features from original prototype:
 - On-the-Fly SED Spectrum plotting (Flux vs. Wavelength)
 - Interactive toggles to overlay spectral line absorption templates
 - 12-band wavelength labels spanning 0.75-5.0µm
 - Per-target SED data from preset catalog
 */
import { useEffect, useRef } from 'react'
import { useTargetState } from '@/src/store'
import { PRESET_TARGETS } from '@/src/constants/presets'
import { MOLECULAR_BANDS } from '@/src/constants/presets'

/**
 * SEDChart - renders a Chart.js line chart of Spectral Energy Distribution.
 * 
 * Props derived from store state:
 - target: current preset target with SED spectrum data
 - selectedBand: currently selected SPHEREx band for highlighting
 - selectedArray: currently selected detector array
 - bands: molecular band overlay definitions
 */
interface SedChartProps {
  target: any
  selectedBand: number
  selectedArray: number
  onBandChange?: (band: number) => void
}

function SedChart({ target, selectedBand, selectedArray, onBandChange }: SedChartProps) {
  const chartRef = useRef<any>(null)
  const { target: storedTarget } = useTargetState()

  // Initialize Chart.js chart on mount
  useEffect(() => {
    const ctx = chartRef.current?.getContext('2d')
    if (!ctx) return

    const t = PRESET_TARGETS[target.key] || PRESET_TARGETS.wise0855

    // Destroy existing chart if re-initializing
    if (chartRef.current?.chartInstance) {
      chartRef.current.chartInstance.destroy()
    }

    // Build wavelength labels from constants
    const wavelengthLabels = BAND_CENTER_WAVELENGTHS.map(w => `${w}µm`)

    chartRef.current = new (require('chart.js') as any).default(ctx, {
      type: 'line',
      data: {
        labels: wavelengthLabels,
        datasets: [{
          label: `SED Flux (${t.name})`,
          data: t.sedSpectrum,
          borderColor: '#00f3ff',
          backgroundColor: 'rgba(0, 243, 255, 0.15)',
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#9d4edd',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context: any) {
                return `Flux: ${context.raw} mJy`
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8', font: { size: 9, family: 'JetBrains Mono' } },
            grid: { color: '#1f2a44' }
          },
          y: {
            ticks: { color: '#94a3b8', font: { size: 9, family: 'JetBrains Mono' } },
            grid: { color: '#1f2a44' }
          }
        }
      }
    })
  }, [target.key])

  return (
    <div className="bg-space-900 border border-space-border rounded-xl p-3 shadow-md flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-200">
          <i className="fa-solid fa-chart-line text-cyan-400"></i>
          <span>On-the-Fly SED Spectrum</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Flux vs λ (µm)</span>
      </div>

      <div className="relative w-full aspect-[4/3] bg-space-950 rounded-lg border border-space-border p-1">
        <canvas ref={chartRef} id="sedChart"></canvas>
      </div>

      {/* Molecular Absorption Flags Summary - interactive overlays */}
      <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] font-mono">
        {MOLECULAR_BANDS.map((band, i) => (
          <div key={band.name} className={selectedBand ? `bg-space-950 border border-${band.color}/30 p-1 rounded text-center text-${band.color}-300` : 'bg-transparent border-transparent p-1 rounded text-center text-slate-400'}>
            <div className="font-bold'>{band.name}</div>
            <div className="text-slate-400'>{band.wavelengths.map((w: number) => `${w}µm`).join(' & ')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SedChart