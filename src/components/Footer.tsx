/**
 * Footer Component
 * Site footer with mission information and copyright.
 */
function Footer() {
  return (
    <footer className="border-t border-space-border bg-space-900 py-3 px-4 text-center text-xs text-slate-400 font-mono mt-auto">
      <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>2026 NASA Space Apps Challenge — Planet X and SPHEREx Explorer Tool</div>
        <div className="flex items-center space-x-4">
          <span>Mapping sky every 6 months in 102 infrared bands</span>
          <span className="text-cyan-400">SPHEREx Mission Data Simulated</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer