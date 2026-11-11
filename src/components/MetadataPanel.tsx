/**
 * MetadataPanel — Quality Control & Contamination flags display.
 */
interface MetadataPanelProps {
  target: any
  selectedBand: number
  selectedArray: number
}

function MetadataPanel({ target }: MetadataPanelProps) {
  return (
    <div className="bg-space-900 border border-space-border rounded-xl p-3 shadow-md space-y-2">
      <div className="text-xs font-mono font-bold text-slate-200 flex items-center space-x-2">
        <i className="fa-solid fa-triangle-exclamation text-amber-400" />
        <span>Quality Control & Contamination Flags</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div className="bg-space-950 p-2 rounded border border-space-border">
          <div className="text-slate-400">Pixel Quality Map</div>
          <div className="text-emerald-400 font-bold flex items-center space-x-1 mt-0.5">
            <i className="fa-solid fa-circle-check" />
            <span>Nominal (0x00)</span>
          </div>
        </div>

        <div className="bg-space-950 p-2 rounded border border-space-border">
          <div className="text-slate-400">Stray Light Status</div>
          <div className="text-slate-300 font-bold flex items-center space-x-1 mt-0.5">
            <i className="fa-solid fa-sun text-amber-400" />
            {/* ✅ FIX: escape `<` as `&lt;` */}
            <span>Low (&lt; 2.1%)</span>
          </div>
        </div>

        <div className="bg-space-950 p-2 rounded border border-space-border">
          <div className="text-slate-400">Cosmic Ray Flag</div>
          <div className="text-emerald-400 font-bold flex items-center space-x-1 mt-0.5">
            <i className="fa-solid fa-shield-halved" />
            <span>Cleaned</span>
          </div>
        </div>

        <div className="bg-space-950 p-2 rounded border border-space-border">
          <div className="text-slate-400">Parallax Confidence</div>
          <div className="text-cyan-400 font-bold flex items-center space-x-1 mt-0.5">
            <i className="fa-solid fa-bullseye" />
            <span>{target?.conf || '99.4% (High)'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MetadataPanel