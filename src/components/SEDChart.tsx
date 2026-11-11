/**
 * SEDChart — Chart.js line plot of Spectral Energy Distribution.
 * Fixed: ESM import for Chart.js, hooks call moved, missing imports added.
 */
import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import { PRESET_TARGETS, BAND_CENTER_WAVELENGTHS, MOLECULAR_BANDS } from '@/constants/presets'

interface SedChartProps {
  target: any
  selectedBand: number
  selectedArray: number
  bands?: any[]
  onBandChange?: (band: number) => void
}

function SedChart({ target, selectedBand }: SedChartProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null)
  const chartInstanceRef = useRef<Chart | null>(null)

  useEffect(() => {
    const ctx = chartRef.current?.getContext('2d')
    if (!ctx) return

    const t = PRESET_TARGETS[target.key] || PRESET_TARGETS.wise0855

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
    }

    const wavelengthLabels = BAND_CENTER_WAVELENGTHS.slice(0, 12).map(w => `${w}µm`)

    chartInstanceRef.current = new Chart(ctx, {
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
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx: any) => `Flux: ${ctx.raw} mJy` },
          },
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8', font: { size: 9, family: 'JetBrains Mono' } },
            grid: { color: '#1f2a44' },
          },
          y: {
            ticks: { color: '#94a3b8', font: { size: 9, family: 'JetBrains Mono' } },
            grid: { color: '#1f2a44' },
          },
        },
      },
    })

    return () => {
      chartInstanceRef.current?.destroy()
      chartInstanceRef.current = null
    }
  }, [target.key])

  return (
    <div className="bg-space-900 border border-space-border rounded-xl p-3 shadow-md flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-200">
          <i className="fa-solid fa-chart-line text-cyan-400" />
          <span>On-the-Fly SED Spectrum</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Flux vs λ (µm)</span>
      </div>

      <div className="relative w-full aspect-[4/3] bg-space-950 rounded-lg border border-space-border p-1">
        <canvas ref={chartRef} />
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] font-mono">
        {MOLECULAR_BANDS.map((band) => (
          <div key={band.name} className="bg-space-950 border border-slate-700 p-1 rounded text-center text-slate-300">
            <div className="font-bold">{band.name}</div>
            <div className="text-slate-400">{band.wavelengths.map(w => `${w}µm`).join(' & ')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SedChart