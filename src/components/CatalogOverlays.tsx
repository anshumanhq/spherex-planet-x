/**
 * CatalogOverlays — toggle catalog overlay rendering.
 * Fixed: prop types match how App.tsx calls it.
 */
interface CatalogOverlaysProps {
  overlays: { gaia: boolean; wise: boolean; simbad: boolean }
  onToggleGaia: (key: 'gaia' | 'wise' | 'simbad', value: boolean) => void
  onToggleWise: (key: 'gaia' | 'wise' | 'simbad', value: boolean) => void
  onToggleSimbad: (key: 'gaia' | 'wise' | 'simbad', value: boolean) => void
}

function CatalogOverlays({ overlays, onToggleGaia, onToggleWise, onToggleSimbad }: CatalogOverlaysProps) {
  return (
    <div className="bg-space-900 border border-space-border rounded-xl p-3 shadow-md space-y-2">
      <div className="text-xs font-mono font-bold text-slate-200 flex items-center justify-between">
        <span><i className="fa-solid fa-globe text-amber-400 mr-1.5" /> Astronomical Catalog Overlays</span>
        <span className="text-[10px] text-slate-400 font-normal">CDS / Gaia / WISE</span>
      </div>

      <div className="space-y-1.5 text-xs font-mono">
        <label className="flex items-center justify-between bg-space-950 p-2 rounded border border-space-border cursor-pointer hover:border-slate-600 transition">
          <span className="flex items-center space-x-2 text-slate-300">
            <i className="fa-solid fa-arrows-up-down-left-right text-emerald-400" />
            <span>Gaia DR3 Proper Motion Vectors</span>
          </span>
          <input type="checkbox" checked={overlays.gaia}
            onChange={e => onToggleGaia('gaia', e.target.checked)}
            className="accent-emerald-400 w-4 h-4 cursor-pointer" />
        </label>

        <label className="flex items-center justify-between bg-space-950 p-2 rounded border border-space-border cursor-pointer hover:border-slate-600 transition">
          <span className="flex items-center space-x-2 text-slate-300">
            <i className="fa-solid fa-circle-notch text-amber-400" />
            <span>WISE AllWISE Infrared Catalog</span>
          </span>
          <input type="checkbox" checked={overlays.wise}
            onChange={e => onToggleWise('wise', e.target.checked)}
            className="accent-amber-400 w-4 h-4 cursor-pointer" />
        </label>

        <label className="flex items-center justify-between bg-space-950 p-2 rounded border border-space-border cursor-pointer hover:border-slate-600 transition">
          <span className="flex items-center space-x-2 text-slate-300">
            <i className="fa-solid fa-tag text-cyan-400" />
            <span>Simbad Identifier Labels</span>
          </span>
          <input type="checkbox" checked={overlays.simbad}
            onChange={e => onToggleSimbad('simbad', e.target.checked)}
            className="accent-cyan-400 w-4 h-4 cursor-pointer" />
        </label>
      </div>
    </div>
  )
}

export default CatalogOverlays