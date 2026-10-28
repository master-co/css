'use client'

import { useCallback, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'

/** Client figures for the homepage's Design system section. */
export default function DesignSystemFigures() {
  return null
}

interface PaletteSwatch {
  gamut: string
  id: string
  token: string
  value: string
}

/**
 * The P3 palette field with a readout: pointing at a swatch, tapping it or moving through the
 * field with the arrow keys names its class and preset value. Swatches are server-rendered options
 * that carry their data as attributes, so this island only listens and marks the active one.
 */
export function PaletteExplorer({ caption, children, columns, label, mark }: { caption: ReactNode, children: ReactNode, columns: number, label: string, mark: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLElement | null>(null)
  const [swatch, setSwatch] = useState<PaletteSwatch>()

  const swatches = useCallback(() => [...stageRef.current?.querySelectorAll<HTMLElement>('[data-token]') ?? []], [])

  const activate = useCallback((element: HTMLElement | null) => {
    if (activeRef.current === element) return
    activeRef.current?.removeAttribute('data-active')
    activeRef.current?.setAttribute('aria-selected', 'false')
    activeRef.current = element
    if (!element) return setSwatch(undefined)
    element.setAttribute('data-active', '')
    element.setAttribute('aria-selected', 'true')
    setSwatch({ gamut: element.dataset.gamut!, id: element.id, token: element.dataset.token!, value: element.dataset.value! })
  }, [])

  useEffect(() => () => activate(null), [activate])

  function handlePointerOver(event: PointerEvent<HTMLDivElement>) {
    const target = (event.target as Element).closest<HTMLElement>('[data-token]')
    if (target) activate(target)
  }

  // A mouse leaving clears the readout; a finger lifting keeps the swatch it tapped.
  function handlePointerLeave(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && !stageRef.current?.matches(':focus-visible')) activate(null)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const list = swatches()
    const index = activeRef.current ? list.indexOf(activeRef.current) : -1
    const rows = Math.ceil(list.length / columns)
    const row = Math.max(0, Math.floor(index / columns))
    const column = Math.max(0, index % columns)
    const next = {
      ArrowLeft: index < 0 ? 0 : row * columns + Math.max(0, column - 1),
      ArrowRight: index < 0 ? 0 : row * columns + Math.min(columns - 1, column + 1),
      ArrowUp: index < 0 ? 0 : Math.max(0, row - 1) * columns + column,
      ArrowDown: index < 0 ? 0 : Math.min(rows - 1, row + 1) * columns + column,
      Home: row * columns,
      End: row * columns + columns - 1,
      Escape: -1
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    activate(next < 0 ? null : list[Math.min(next, list.length - 1)])
  }

  return (
    <div className="home-palette-stage" data-active={swatch ? '' : undefined}>
      {caption}
      <div
        aria-activedescendant={swatch?.id}
        aria-label={label}
        className="home-bento-visual home-palette-scene"
        onBlur={(event: FocusEvent<HTMLDivElement>) => {
          if (!event.currentTarget.contains(event.relatedTarget)) activate(null)
        }}
        onKeyDown={handleKeyDown}
        onPointerLeave={handlePointerLeave}
        onPointerOver={handlePointerOver}
        ref={stageRef}
        role="listbox"
        tabIndex={0}>
        {children}
        {/* The well's top-right corner: the height mark at rest, the picked swatch's readout once one is picked. */}
        <div aria-hidden="true" className="home-palette-meta">
          {mark}
          <p className="home-palette-readout">
            {swatch && <>
              <span className="home-palette-readout-swatch" style={{ backgroundColor: swatch.value }} />
              <code className="home-palette-readout-token">{swatch.token}</code>
              <code className="home-palette-readout-value">{swatch.value}</code>
              <code className="home-palette-readout-gamut" data-gamut={swatch.gamut}>{swatch.gamut}</code>
            </>}
          </p>
        </div>
      </div>
    </div>
  )
}
