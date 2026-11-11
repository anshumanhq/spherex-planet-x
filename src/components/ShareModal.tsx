/**
 * ShareModal — URL + embed code sharing.
 * Fixed: onClose optional.
 */
interface ShareModalProps {
  target: any
  ra: string
  dec: string
  fov: number
  selectedBand: number
  onCopyUrl: () => void
  onClose?: () => void
}

function ShareModal({ target, ra, dec, fov, selectedBand, onCopyUrl, onClose }: ShareModalProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''
  const fullUrl = `${baseUrl}?target=${target.key}&ra=${encodeURIComponent(ra)}&dec=${encodeURIComponent(dec)}&fov=${fov}&band=${selectedBand}`

  return (
    <div className="bg-space-900 border border-space-border rounded-xl p-3 shadow-md space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono font-bold text-slate-200">
          <i className="fa-solid fa-share-nodes text-cyan-400 mr-1.5" /> Share View
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <i className="fa-solid fa-xmark" />
          </button>
        )}
      </div>
      <div className="font-mono text-xs space-y-2">
        <input type="text" readOnly value={fullUrl}
          className="w-full bg-space-950 border border-space-border rounded p-2 text-cyan-300 text-[11px]" />
        <button onClick={onCopyUrl}
          className="w-full py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs">
          <i className="fa-solid fa-copy mr-1" /> Copy URL
        </button>
      </div>
    </div>
  )
}

export default ShareModal