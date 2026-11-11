/**
 * Discovery Log Component
 * Citizen discovery log for recording candidate objects found on the viewer canvas.
 * Supports CSV export of logged candidates.
 */
interface DiscoveryLogProps {
  logs: any[]
  onClear: () => void
  onExport?: () => void
}

function DiscoveryLog({ logs, onClear, onExport }: DiscoveryLogProps) {
  return (
    <div className="bg-space-900 border border-space-border rounded-xl p-3 shadow-md space-y-2 flex-1 flex flex-col">
      <div className="text-xs font-mono font-bold text-slate-200 flex items-center justify-between">
        <span>
          <i className="fa-solid fa-clipboard-list text-cyan-400 mr-1.5"></i>
          Citizen Discovery Log
        </span>
        <button id="btnClearLog" className="text-[10px] text-slate-400 hover:text-cyan-400">Clear</button>
      </div>

      <div id="discoveryLog" className="bg-space-950 border border-space-border rounded-lg p-2 font-mono text-[11px] text-slate-300 flex-1 overflow-y-auto max-h-[140px] space-y-1">
        {logs.length > 0 ? (
          logs.map((item: any, idx: number) => (
            <div key={idx} className="bg-space-900 border border-space-border p-1.5 rounded flex items-center justify-between">
              <div>
                <span className="text-cyan-400 font-bold">{item.name}</span>
                <span className="text-slate-400 font-mono text-[10px]"> [Epoch {item.epoch}]</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">Candidate Logged</span>
            </div>
          ))
        ) : (
          <div className="text-slate-400 font-sans italic text-[10px]">
            Click targets on the visualizer sky canvas to record candidate objects...
          </div>
        )}
      </div>

      <button
        id="btnExportLog"
        className="w-full py-1.5 rounded-lg bg-space-800 hover:bg-space-700 border border-space-border text-xs font-mono text-cyan-400 transition flex items-center justify-center space-x-2"
        onClick={onExport}
      >
        <i className="fa-solid fa-download"></i>
        <span>Export Candidate Observations (.CSV)</span>
      </button>
    </div>
  )
}

export default DiscoveryLog