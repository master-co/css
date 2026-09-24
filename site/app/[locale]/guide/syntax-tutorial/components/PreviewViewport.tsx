'use client'

import { useThemeMode } from '@master/theme-mode.react'
import clsx from 'clsx'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function PreviewViewport({ html, breakpoint, responsive }: { html: string; breakpoint: number; responsive: boolean }) {
  const [wide, setWide] = useState(false)
  const themeMode = useThemeMode()
  const mode = themeMode.value
  const frameRef = useRef<HTMLIFrameElement>(null)
  const width = wide ? Math.ceil(breakpoint) + 1 : Math.floor(breakpoint) - 1
  // The site theme is a class plus an inline color scheme on the host <html>; a srcDoc
  // frame shares neither, so push both across the boundary the way the site HTML layout does
  // writes them. Until this runs the frame keeps the srcDoc default of `light dark`.
  const syncFrameThemeMode = useCallback(() => {
    const frameRoot = frameRef.current?.contentDocument?.documentElement
    if (!frameRoot || (mode !== 'light' && mode !== 'dark')) return
    frameRoot.classList.remove('light', 'dark')
    frameRoot.classList.add(mode)
    frameRoot.style.colorScheme = mode
  }, [mode])
  useEffect(syncFrameThemeMode, [syncFrameThemeMode])
  const toggleClassName = (pressed: boolean) => clsx(
    'btn btn-sm b:1px|solid|var(--color-line-base)',
    pressed ? 'outline:2px|solid|var(--color-accent) surface-raised' : 'surface-raised:hover'
  )
  return <div style={{ width: '100%', minWidth: 0 }}>
    {responsive && <div className="flex flex-wrap items-center gap-sm text-sm" role="group" aria-label="Preview viewport">
      <button type="button" className={toggleClassName(!wide)} aria-pressed={!wide} onClick={() => setWide(false)}>Below sm</button>
      <button type="button" className={toggleClassName(wide)} aria-pressed={wide} onClick={() => setWide(true)}>At sm and above</button>
      <span role="status">Viewport: {width}px</span>
    </div>}
    <div className="overflow:hidden">
      <iframe ref={frameRef} onLoad={syncFrameThemeMode} title={responsive ? 'Responsive syntax tutorial button preview' : 'Syntax tutorial button preview'} sandbox="allow-same-origin" srcDoc={html} height={140} style={{ width: responsive ? width : '100%', maxWidth: 'none', border: 0 }} />
    </div>
  </div>
}
