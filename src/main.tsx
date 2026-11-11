/**
 * Standalone entry point — renders LiveDataPanel only.
 * Lidiya's App.tsx has unresolved syntax issues, so we temporarily
 * skip it during the hackathon. Post-hackathon, fix App.tsx and merge.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import './main.css'
import LiveDataPanel from './components/LiveDataPanel'

function Root() {
  return (
    <div className="min-h-screen bg-space-950 text-slate-100 font-mono p-4">
      <header className="max-w-[1800px] mx-auto mb-4">
        <h1 className="text-2xl font-bold text-cyan-300">
          🌌 SPHEREx Planet X — Live Data Viewer
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Real NASA SPHEREx data · 142 epochs · 1 year of WISE 0855 observations
        </p>
      </header>
      <LiveDataPanel />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)