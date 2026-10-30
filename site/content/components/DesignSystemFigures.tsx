'use client'

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import type { PaletteCanvas } from './palette-canvas'

/** Client figures for the homepage's Design system section. */
export default function DesignSystemFigures() { return null }

interface PaletteSwatch {
  id: string
  token: string
  value: string
  wide: boolean
}

/** Native options own the colors and accessibility; the canvas is their measured visual projection. */
export function PaletteExplorer({ children, columns, label, summary }: { children: ReactNode, columns: number, label: string, summary: string }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<PaletteCanvas>(undefined)
  const activeRef = useRef<HTMLElement | null>(null)
  const optionsRef = useRef<HTMLElement[]>([])
  const pinnedRef = useRef(false)
  const [swatch, setSwatch] = useState<PaletteSwatch>()
  const [pinned, setPinned] = useState(false)

  const activate = useCallback((element: HTMLElement | null, keep: boolean) => {
    if (activeRef.current === element && pinnedRef.current === keep) return
    activeRef.current?.removeAttribute('data-active')
    activeRef.current?.setAttribute('aria-selected', 'false')
    activeRef.current = element
    pinnedRef.current = !!element && keep
    setPinned(pinnedRef.current)
    rendererRef.current?.select(element, pinnedRef.current)
    if (!element) { setSwatch(undefined); return }
    element.setAttribute('data-active', '')
    element.setAttribute('aria-selected', 'true')
    setSwatch({ id: element.id, token: element.dataset.token!, value: element.dataset.value!, wide: element.dataset.gamut === 'P3' })
  }, [])

  const preview = useCallback((element: HTMLElement | null) => {
    if (!pinnedRef.current && !stageRef.current?.matches(':focus-visible')) activate(element, false)
  }, [activate])

  const choose = useCallback((element: HTMLElement) => activate(element, true), [activate])

  useEffect(() => {
    let disposed = false
    optionsRef.current = [...stageRef.current!.querySelectorAll<HTMLElement>('[data-token]')]
    const nearby = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      nearby.disconnect()
      void import('./palette-canvas').then(({ mountPaletteCanvas }) => {
        if (disposed) return
        rendererRef.current = mountPaletteCanvas(stageRef.current!, canvasRef.current!, { preview, choose })
        rendererRef.current?.select(activeRef.current, pinnedRef.current)
      }).catch(() => {
        // The native color table remains usable if the optional drawing module cannot load.
      })
    }, { rootMargin: '200px 0px' })
    nearby.observe(stageRef.current!)
    return () => {
      disposed = true
      nearby.disconnect()
      rendererRef.current?.dispose()
      rendererRef.current = undefined
    }
  }, [preview, choose])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const list = optionsRef.current
    const index = activeRef.current ? list.indexOf(activeRef.current) : -1
    const row = Math.max(0, Math.floor(index / columns)), column = Math.max(0, index % columns)
    const rows = Math.ceil(list.length / columns)
    const next = {
      ArrowLeft: index < 0 ? 0 : row * columns + Math.max(0, column - 1),
      ArrowRight: index < 0 ? 0 : row * columns + Math.min(columns - 1, column + 1),
      ArrowUp: index < 0 ? 0 : Math.max(0, row - 1) * columns + column,
      ArrowDown: index < 0 ? 0 : Math.min(rows - 1, row + 1) * columns + column,
      PageUp: Math.max(0, row - 3) * columns + column,
      PageDown: Math.min(rows - 1, row + 3) * columns + column,
      Home: event.ctrlKey || event.metaKey ? 0 : row * columns,
      End: event.ctrlKey || event.metaKey ? list.length - 1 : row * columns + columns - 1,
      Enter: Math.max(0, index),
      ' ': Math.max(0, index),
      Escape: -1
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    rendererRef.current?.keyboard()
    if (next >= 0) {
      activate(list[Math.min(next, list.length - 1)], true)
    } else activate(null, false)
  }

  // The static table still supports selection if a browser cannot create a Canvas context.
  function handleFallbackPointer(event: PointerEvent<HTMLDivElement>) {
    if (rendererRef.current) return
    const element = (event.target as Element).closest<HTMLElement>('[data-token]')
    if (element) preview(element)
  }

  return (
    <div className="home-bento-visual home-palette-stage" data-active={swatch ? '' : undefined} data-pinned={pinned || undefined}>
      <div aria-hidden="true" className="home-annotation home-palette-annotations">
        <span>Display P3</span>
        <span>{summary}</span>
      </div>
      <div
        aria-activedescendant={swatch?.id}
        aria-label={label}
        className="home-palette-scene"
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget) && !pinnedRef.current) activate(null, false)
        }}
        onClick={(event) => {
          if (rendererRef.current) return
          const element = (event.target as Element).closest<HTMLElement>('[data-token]')
          if (element) choose(element)
        }}
        onKeyDown={handleKeyDown}
        onPointerLeave={(event) => {
          if (!rendererRef.current && event.pointerType === 'mouse') preview(null)
        }}
        onPointerOver={handleFallbackPointer}
        ref={stageRef}
        role="listbox"
        tabIndex={0}>
        {children}
        <canvas aria-hidden="true" className="home-palette-canvas" ref={canvasRef} />
      </div>
      <div aria-hidden="true" className="home-palette-inspector">
        <span className="home-palette-current-swatch" style={{ backgroundColor: swatch?.value }} />
        <code className="home-palette-token">{swatch?.token}</code>
        <code className="home-palette-value">{swatch?.value}</code>
        <span className="home-palette-gamut">{swatch ? swatch.wide ? 'P3' : 'sRGB' : ''}</span>
      </div>
    </div>
  )
}
