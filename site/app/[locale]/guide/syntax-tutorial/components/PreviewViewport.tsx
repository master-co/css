'use client'

import { useState } from 'react'

export default function PreviewViewport({ html, breakpoint, responsive }: { html: string; breakpoint: number; responsive: boolean }) {
  const [wide, setWide] = useState(false)
  const width = wide ? Math.ceil(breakpoint) + 1 : Math.floor(breakpoint) - 1
  return <div style={{ width: '100%', minWidth: 0 }}>
    {responsive && <div className="flex flex-wrap items-center gap:sm text:sm" role="group" aria-label="Preview viewport">
      <button type="button" className="btn btn-sm" aria-pressed={!wide} onClick={() => setWide(false)}>Below sm</button>
      <button type="button" className="btn btn-sm" aria-pressed={wide} onClick={() => setWide(true)}>At sm and above</button>
      <span role="status">Viewport: {width}px</span>
    </div>}
    <div className="overflow:hidden">
      <iframe title={responsive ? 'Responsive syntax tutorial button preview' : 'Syntax tutorial button preview'} sandbox="allow-same-origin" srcDoc={html} height={140} style={{ width: responsive ? width : '100%', maxWidth: 'none', border: 0 }} />
    </div>
  </div>
}
