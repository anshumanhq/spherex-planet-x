/**
 * Target Navigator Component
 * Search bar supporting Equatorial Coordinates (RA/Dec) and target name resolution.
 * Pre-loaded Quick-Load Presets with URL parameter synchronization.
 * 
 * Features from original prototype:
 - Search bar with RA (0-360° or HH:MM:SS) and Dec (-90 to +90° or DD:MM:SS) inputs
 - Quick-Load Presets: Barnard's Star, Epsilon Indi B, WISE 0855, RW Aurigae, R Draconis, Planet X
 - Dynamic URL parameter synchronization (?ra=...&dec=...&zoom=...&bands=...) for link sharing
 - Preset target selection updates coordinates, FOV, and starfield generation
 */
interface TargetNavigatorProps {
  targetKey: string
  ra: string
  dec: string
  onTargetChange: (key: string) => void
  onCoordinatesChange: (ra: string, dec: string) => void
  quickLoadPresets: string[]
  onFovChange?: (val: number) => void
}

function TargetNavigator({ targetKey, ra, dec, onTargetChange, onCoordinatesChange, quickLoadPresets, onFovChange }: TargetNavigatorProps) {
  // Handle preset selection change
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value
    onTargetChange(key)
    const t = PRESET_TARGETS[key]
    if (t) {
      onCoordinatesChange(t.ra, t.dec)
      if (onFovChange) onFovChange(t.fov)
    }
  }

  // Handle coordinate search button
  const handleSearch = () => {
    const raInput = document.getElementById('inputRA') as HTMLInputElement
    const decInput = document.getElementById('inputDec') as HTMLInputElement
    if (raInput && decInput) {
      onCoordinatesChange(raInput.value, decInput.value)
    }
  }

  // Handle FOV change from slider
  const handleFOVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fovVal = parseFloat(e.target.value)
    if (onFovChange) onFovChange(fovVal)
  }

  return (
    <div className="bg-space-900 border border-space-border rounded-xl p-3 shadow-md grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-3 items-center">

      {/* Coordinate Inputs */}
      <div className="xl:col-span-5 flex items-center space-x-2">
        <div className="flex-1 relative">
          <span className="absolute left-2.5 top-2 text-[10px] font-mono text-cyan-400 font-bold">RA</span>
          <input type="text" id="inputRA" value={ra} placeholder="RA (e.g. 08h 55m 10.83s)"
            className="w-full bg-space-950 border border-space-border rounded-lg pl-9 pr-2 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-400 text-slate-100"
          />
        </div>
        <div className="flex-1 relative">
          <span className="absolute left-2.5 top-2 text-[10px] font-mono text-cyan-400 font-bold">DEC</span>
          <input type="text" id="inputDec" value={dec} placeholder="Dec (e.g. -07° 14' 42.5")"
            className="w-full bg-space-950 border border-space-border rounded-lg pl-10 pr-2 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-400 text-slate-100"
          />
        </div>
        <button onClick={handleSearch} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs transition shadow-md shadow-cyan-500/20">
          Go
        </button>
      </div>

      {/* Target Presets Select */}
      <div className="xl:col-span-4 flex items-center space-x-2">
        <label className="text-xs font-mono text-slate-400 whitespace-nowrap"><i className="fa-solid fa-crosshairs text-amber-400 mr-1"></i> Target:</label>
        <select id="presetSelect" value={targetKey} onChange={handlePresetChange} className="w-full bg-space-950 border border-space-border text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400">
          {quickLoadPresets.map(key => {
            const t = PRESET_TARGETS[key]
            return (
              <option key={key} value={key} selected={targetKey === key}>
                {t ? `${t.name} (${t.type})` : key}
              </option>
            )
          })}
          <option value="planetX" selected={targetKey === 'planetX'}>Hypothetical Planet X / Kuiper Candidate</option>
        </select>
      </div>

      {/* FOV Slider */}
      <div className="xl:col-span-3 flex items-center space-x-2">
        <span className="text-xs font-mono text-slate-400 whitespace-nowrap">FOV: <span id="fovValue" className="text-cyan-400 font-bold">{Math.round((parseFloat(dec) || 0.5) * 10) / 10}°</span></span>
        <input type="range" id="fovSlider" min="0.1" max="2.0" step="0.1" value={parseFloat(dec) || 0.5}
          className="w-full h-1.5 bg-space-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          onChange={handleFOVChange}
        />
      </div>
    </div>
  )
}

export default TargetNavigator