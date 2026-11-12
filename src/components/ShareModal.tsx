/**
 * ShareModal — shows current URL (with ra/dec/n_frames synced by LiveDataPanel).
 * Copy button copies the exact URL shown.
 */
import { useState, useEffect } from 'react'
import { Copy, X, Check, Share2 } from 'lucide-react'

interface ShareModalProps {
  open: boolean
  onClose: () => void
}

function ShareModal({ open, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState('')

  // Refresh URL each time the modal opens (LiveDataPanel may have updated it)
  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      setUrl(window.location.href)
      setCopied(false)
    }
  }, [open])

  // ESC closes
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const embedCode = `<iframe src="${url}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0a0f1c] border border-cyan-500/30 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 font-mono"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share This View
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Shareable URL:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                readOnly
                onFocus={e => e.currentTarget.select()}
                aria-label="Shareable URL"
                className="flex-1 bg-[#0f172a] border border-slate-700 rounded p-2 text-cyan-300 text-[11px] focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={copy}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1.5 rounded flex items-center gap-1 text-xs transition"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Embed code (optional):</label>
            <textarea
              readOnly
              rows={3}
              value={embedCode}
              onFocus={e => e.currentTarget.select()}
              aria-label="Embed code"
              className="w-full bg-[#0f172a] border border-slate-700 rounded p-2 text-slate-400 text-[10px] focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <p className="text-[10px] text-slate-500 italic">
            Anyone opening this link will auto-load the same observation with the same frames.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ShareModal