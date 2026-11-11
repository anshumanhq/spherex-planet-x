/**
 * Metadata Panel Component
 * Quality Control & Contamination Flags display.
 * Shows pixel quality map, stray light status, cosmic ray flag, and parallax confidence.
 */
interface MetadataPanelProps {
  target: any
  selectedBand: number
  selectedArray: number
}

function MetadataPanel({ target, selectedBand, selectedArray }: MetadataPanelProps) {
  return (
    <div className="bg-space-900 border border-space-border rounded-xl p-3 shadow-md space-y-2">
      <div className="text-xs font-mono font-bold text-slate-200 flex items-center space-x-2">
        <i className="fa-solid fa-triangle-exclamation text-amber-400"></i>
        <span>Quality Control & Contamination Flags</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div className="bg-space-950 p-2 rounded border border-space-border">
          <div className="text-slate-400">Pixel Quality Map</div>
          <div className="text-emerald-400 font-bold flex items-center space-x-1 mt-0.5">
            <i className="fa-solid fa-circle-check"></i>
            <span>Nominal (0x00)</span>
          </div>
        </div>

        <div className="bg-space-950 p-2 rounded border border-space-border">
          <div className="text-slate-400">Stray Light Status</div>
          <div className="text-slate-300 font-bold flex items-center space-x-1 mt-0.5">
            <i className="fa-solid fa-sun text-amber-400"></i>
            <span>Low (< 2.1%)</span>
          </div>
        </div>

        <div className="bg-space-950 p-2 rounded border border-space-border">
          <div className="text-slate-400">Cosmic Ray Flag</div>
          <div className="text-emerald-400 font-bold flex items-center space-x-1 mt-0.5">
            <i className="fa-solid fa-shield-halved"></i>
            <span>Cleaned</span>
          </div>
        </div>

        <div className="bg-space-950 p-2 rounded border border-space-border">
          <div className="text-slate-400">Parallax Confidence</div>
          <div id="metaParallaxConf" className="text-cyan-400 font-bold flex items-center space-x-1 mt-0.5">
            <i className="fa-solid fa-bullseye"></i>
            <span>{target.conf}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MetadataPanel