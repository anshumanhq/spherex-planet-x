/**
 * TargetNavigator — RA/Dec input + preset dropdown + FOV slider.
 * Fixed: PRESET_TARGETS import added.
 */
import { PRESET_TARGETS } from '@/constants/presets'

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
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value
    onTargetChange(key)
    const t = PRESET_TARGETS[key]
    if (t) {
      onCoordinatesChange(t.ra, t.dec)
      if (onFovChange) onFovChange(t.fov)
    }
  }

  return (
    <div className="bg-space-900 border border-space-border rounded-xl p-3 shadow-md grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-3 items-center">
      <div className="xl:col-span-5 flex items-center space-x-2">
        <div className="flex-1 relative">
          <span className="absolute left-2.5 top-2 text-[10px] font-mono text-cyan-400 font-bold">RA</span>
          <input type="text" value={ra} onChange={e => onCoordinatesChange(e.target.value, dec)}
            className="w-full bg-space-950 border border-space-border rounded-lg pl-9 pr-2 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-400 text-slate-100" />
        </div>
        <div className="flex-1 relative">
          <span className="absolute left-2.5 top-2 text-[10px] font-mono text-cyan-400 font-bold">DEC</span>
          <input type="text" value={dec} onChange={e => onCoordinatesChange(ra, e.target.value)}
            className="w-full bg-space-950 border border-space-border rounded-lg pl-10 pr-2 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-400 text-slate-100" />
        </div>
      </div>

      <div className="xl:col-span-4 flex items-center space-x-2">
        <label className="text-xs font-mono text-slate-400 whitespace-nowrap">
          <i className="fa-solid fa-crosshairs text-amber-400 mr-1" /> Target:
        </label>
        <select value={targetKey} onChange={handlePresetChange}
          className="w-full bg-space-950 border border-space-border text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400">
          {quickLoadPresets.map(key => {
            const t = PRESET_TARGETS[key]
            return <option key={key} value={key}>{t ? `${t.name} (${t.type})` : key}</option>
          })}
        </select>
      </div>

      <div className="xl:col-span-3 flex items-center space-x-2">
        <span className="text-xs font-mono text-slate-400 whitespace-nowrap">FOV:</span>
        <input type="range" min="0.1" max="2.0" step="0.1" defaultValue={0.5}
          onChange={e => onFovChange?.(parseFloat(e.target.value))}
          className="w-full accent-cyan-400" />
      </div>
    </div>
  )
}

export default TargetNavigator