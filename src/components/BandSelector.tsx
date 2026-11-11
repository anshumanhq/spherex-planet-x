/**
 * Band Selector Component
 * Visual selector divided across the 6 SPHEREx detector arrays (0.75 µm to 5.0 µm).
 * Ability to select individual channels or aggregate signal per array.
 */
interface BandSelectorProps {
  arrays: any[]
  totalBands: number
  selectedBand: number
  selectedArray: number
  onBandChange: (band: number) => void
  onArrayChange: (array: number) => void
}

function BandSelector({ arrays, totalBands, selectedBand, selectedArray, onBandChange, onArrayChange }: BandSelectorProps) {
  // Compute current band wavelength
  const bandWavelength = (0.75 + (selectedBand / totalBands) * 4.25).toFixed(2)

  return (
    <div className="bg-space-900 border border-space-border rounded-xl p-3 shadow-md flex flex-col">
      {/* Spectrum Generator header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-200">
          <i className="fa-solid fa-chart-line text-cyan-400"></i>
          <span>On-the-Fly SED Spectrum</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Flux vs λ (µm)</span>
      </div>

      {/* Interactive Chart.js SED canvas */}
      <div className="relative w-full aspect-[4/3] bg-space-950 rounded-lg border border-space-border p-1">
        <canvas id="sedChart" className="w-full h-full"></canvas>
      </div>

      {/* Molecular Absorption Flags Summary */}
      <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] font-mono">
        <div className="bg-space-950 border border-cyan-500/30 p-1 rounded text-center text-cyan-300">
          <div className="font-bold">H₂O</div>
          <div className="text-slate-400">1.4 & 1.9µm</div>
        </div>
        <div className="bg-space-950 border border-violet-500/30 p-1 rounded text-center text-violet-300">
          <div className="font-bold">CH₄</div>
          <div className="text-slate-400">2.3 & 3.3µm</div>
        </div>
        <div className="bg-space-950 border border-amber-500/30 p-1 rounded text-center text-amber-300">
          <div className="font-bold">CO₂</div>
          <div className="text-slate-400">4.2µm</div>
        </div>
        <div className="bg-space-950 border border-emerald-500/30 p-1 rounded text-center text-emerald-300">
          <div className="font-bold">CO</div>
          <div className="text-slate-400">4.6µm</div>
        </div>
      </div>

      {/* Detector Arrays Switcher */}
      <div className="mt-3">
        <div className="text-xs font-mono font-bold text-slate-200">
          <i className="fa-solid fa-wave-square text-violet-400 mr-1.5"></i>
          SPHEREx 102 Spectral Bands Array
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 text-xs font-mono">
          {arrays.map((arr, i) => (
            <button key={arr.id} data-array={arr.id} className={selectedArray === arr.id ? "array-btn bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 p-1.5 rounded text-left transition hover:border-cyan-400" : "array-btn bg-space-900 border border-space-border text-slate-400 p-1.5 rounded text-left transition hover:border-cyan-400"}>
              <div className="font-bold text-[11px]">{arr.label}</div>
              <div className="text-[10px] opacity-75">{arr.wavelengthRange}</div>
            </button>
          ))}
        </div>

        {/* Fine Band Slider */}
        <div className="flex items-center space-x-3 pt-1">
          <span className="text-xs font-mono text-slate-400">Fine Band Tuning (1-102):</span>
          <input type="range" min="1" max={totalBands} value={selectedBand} className="w-full h-2 bg-space-800 rounded-lg appearance-none cursor-pointer accent-violet-400" onChange={(e) => onBandChange(parseInt(e.target.value))} />
          <span className="text-[10px] font-mono text-cyan-400">Band {selectedBand}</span>
        </div>
      </div>
    </div>
  )
}

export default BandSelector