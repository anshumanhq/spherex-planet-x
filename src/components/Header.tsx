/**
 * Header Component
 * Top navigation bar with branding, live status indicators, and share/embed actions.
 * Matches the original HTML prototype's design language.
 */



/**
 * Header - Branding and live status bar
 * 
 * Features from original prototype:
 - SPHEREx SkyExplorer brand logo with NASA Space Apps 2026 badge
 - Live status: SPHEREx Orbit 3 Data Stream ONLINE
 - 102 IR Bands status
 - Share Coordinates and Embed buttons
 */
interface HeaderProps {
  onShareClick?: () => void
}

function Header({ onShareClick }: HeaderProps) {
  return (
    <header className="border-b border-space-border bg-space-900/90 backdrop-blur-md sticky top-0 z-50 px-4 py-2.5">
      <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-4">

        {/* Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
            <i className="fa-solid fa-satellite text-lg"></i>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-wide text-white text-base">SPHEREx SkyExplorer</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">NASA Space Apps 2026</span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Planet X Search & Multi-Spectral Time-Series Visualizer</p>
          </div>
        </div>

        {/* Live Status & Info */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="hidden lg:flex items-center space-x-2 bg-space-800/80 px-3 py-1.5 rounded-full border border-space-border">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-led"></span>
            <span className="text-slate-300">SPHEREx Orbit 3 Data Stream: <span className="text-emerald-400 font-bold">ONLINE</span></span>
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-space-800/80 px-3 py-1.5 rounded-full border border-space-border">
            <i className="fa-solid fa-layer-group text-cyan-400"></i>
            <span>102 IR Bands (0.75 - 5.0µm)</span>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            id="btnShareUrl"
            onClick={onShareClick}
            className="px-3 py-1.5 rounded-lg bg-space-800 hover:bg-space-700 border border-space-border text-xs font-medium text-slate-200 transition flex items-center space-x-2"
          >
            <i className="fa-solid fa-share-nodes text-cyan-400"></i>
            <span>Share Coordinates</span>
          </button>
          <button id="btnEmbedCode" className="px-3 py-1.5 rounded-lg bg-space-800 hover:bg-space-700 border border-space-border text-xs font-medium text-slate-200 transition flex items-center space-x-2">
            <i className="fa-solid fa-code text-violet-400"></i>
            <span>Embed</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header