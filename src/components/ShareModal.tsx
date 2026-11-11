/**
 * Share Modal Component
 * Modal window for sharing observatory coordinates and embedding the viewer widget.
 * Synchronizes with URL parameters for link sharing and embedding.
 */
interface ShareModalProps {
  target: any
  ra: string
  dec: string
  fov: number
  selectedBand: number
  onCopyUrl: () => void
  onClose: () => void
}

function ShareModal({ target, ra, dec, fov, selectedBand, onCopyUrl, onClose }: ShareModalProps) {
  // Generate the full URL when modal opens
  const baseUrl = window.location.origin + window.location.pathname
  const fullUrl = `${baseUrl}?target=${target.key}&ra=${encodeURIComponent(ra)}&dec=${encodeURIComponent(dec)}&fov=${fov}&band=${selectedBand}`

  return (
    <div id="modalContainer" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
      <div className="bg-space-900 border border-space-border rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-space-border pb-3">
          <h3 id="modalTitle" className="text-sm font-mono font-bold text-white flex items-center space-x-2">
            <i className="fa-solid fa-share-nodes text-cyan-400"></i>
            <span>Share Observatory Coordinates</span>
          </h3>
          <button id="btnCloseModal" onClick={onClose} className="text-slate-400 hover:text-white transition">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Generated View URL:</label>
            <input type="text" id="modalUrlInput"
              readonly
              className="w-full bg-space-950 border border-space-border rounded p-2 text-cyan-300 text-[11px] focus:outline-none"
              value={fullUrl} />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Embed HTML Code:</label>
            <textarea id="modalEmbedInput"
              rows="3"
              readonly
              className="w-full bg-space-950 border border-space-border rounded p-2 text-slate-300 text-[11px] focus:outline-none"
            >{`<iframe src="${fullUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`}</textarea>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button id="btnCopyModalText"
            onClick={onCopyUrl}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-md transition">
            <i className="fa-solid fa-copy mr-1"></i> Copy Link
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShareModal