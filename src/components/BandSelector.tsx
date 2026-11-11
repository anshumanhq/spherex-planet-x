/**
 * BandSelector — 6 SPHEREx detector arrays + fine band tuning slider.
 * Fixed: removed duplicate SED canvas (was causing blank SED chart).
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
  const wavelength = (0.75 + (selectedBand / totalBands) * 4.25).toFixed(2)

  return (
    <div className="bg-space-900 border border-space-border rounded-xl p-3 shadow-md flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-200">
          <i className="fa-solid fa-wave-square text-violet-400" />
          <span>SPHEREx 102 Spectral Bands</span>
        </div>
        <span className="text-[10px] font-mono text-cyan-400">
          Band {selectedBand} / {wavelength} µm
        </span>
      </div>

      {/* Array buttons */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs font-mono">
        {arrays.map((arr) => (
          <button
            key={arr.id}
            onClick={() => {
              onArrayChange(arr.id)
              const arrayStarts = [1, 18, 35, 52, 70, 88]
              onBandChange(arrayStarts[arr.id - 1] || 1)
            }}
            className={
              selectedArray === arr.id
                ? "bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 p-1.5 rounded text-left transition"
                : "bg-space-900 border border-space-border text-slate-400 p-1.5 rounded text-left transition hover:border-cyan-400"
            }
          >
            <div className="font-bold text-[11px]">{arr.label}</div>
            <div className="text-[10px] opacity-75">{arr.wavelengthRange}</div>
          </button>
        ))}
      </div>

      {/* Fine band slider */}
      <div className="flex items-center space-x-3 pt-1">
        <span className="text-xs font-mono text-slate-400 whitespace-nowrap">Fine Tuning:</span>
        <input
          type="range"
          min="1"
          max={totalBands}
          value={selectedBand}
          onChange={(e) => onBandChange(parseInt(e.target.value))}
          className="flex-1 accent-violet-400 cursor-pointer"
        />
        <span className="text-[10px] font-mono text-violet-300 w-16 text-right">{selectedBand}/{totalBands}</span>
      </div>
    </div>
  )
}

export default BandSelector