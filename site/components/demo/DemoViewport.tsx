'use client'

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { IconMoon, IconPlayerPause, IconPlayerPlay, IconPrinter, IconRefresh, IconSun } from '@tabler/icons-react'
import { demoPlayback, type PlaybackAction } from './playback'
import { demoDragReadings } from './drag-readings'

interface ViewportOptions {
  title: string
  /** Resize the actual iframe viewport. */
  responsive?: boolean
  /** Browser chrome; only where the viewport itself is the lesson. Defaults to `responsive`. The tray head names the document. */
  chrome?: boolean
  /** Named real viewport widths; the first is the initial width when responsive. */
  widthPresets?: readonly { label: string; width: number }[]
  motion?: boolean
  print?: boolean
  theme?: boolean
  /** Pin the initial mode; omit to follow the surrounding document. */
  initialTheme?: 'light' | 'dark'
  inspect?: string[]
  height?: number
  /** Upper bound for the actual iframe width, including wide breakpoint examples. */
  maxWidth?: number
  /** Content sizing is only for normal flow, never viewport-dependent geometry. */
  sizing?: 'viewport' | 'content'
}

export type DemoViewportProps = ViewportOptions & (
  { document: string, src?: never } | { document?: never, src: string }
)

export default function DemoViewport({ title, document: source, src, responsive = false, chrome = responsive, widthPresets, motion = false, print = false, theme = false, initialTheme, inspect, height = 260, maxWidth = 1600, sizing = 'viewport' }: DemoViewportProps) {
  const ref = useRef<HTMLIFrameElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const cleanup = useRef<() => void>(() => {})
  const playback = useRef<ReturnType<typeof demoPlayback> | null>(null)
  const [width, setWidth] = useState<number | undefined>(responsive ? widthPresets?.[0]?.width : undefined)
  const [fitWidth, setFitWidth] = useState(480)
  const [minimumWidth, setMinimumWidth] = useState(240)
  const [dark, setDark] = useState<boolean | undefined>(initialTheme === undefined ? undefined : initialTheme === 'dark')
  const [isDark, setIsDark] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const [contentHeight, setContentHeight] = useState<number>()
  const [properties, setProperties] = useState('')
  const widthId = useId()

  const load = useCallback(() => {
    cleanup.current()
    const frame = ref.current
    const doc = frame?.contentDocument
    const view = frame?.contentWindow
    if (!frame || !view || !doc?.documentElement || !doc.body?.childElementCount) return
    let active = true
    // Resize/font/event callbacks can run after removal but before passive
    // effect cleanup, or after the same iframe has loaded a new document.
    const current = () => active && frame.isConnected && frame.contentDocument === doc
    const applyTheme = () => {
      if (!current()) return
      const mode = dark ?? document.documentElement.classList.contains('dark')
      doc.documentElement.classList.toggle('dark', mode)
      doc.documentElement.classList.toggle('light', !mode)
      doc.documentElement.style.colorScheme = mode ? 'dark' : 'light'
      setIsDark(mode)
    }
    const writeReading = (output: HTMLElement, value: string) => {
      if (output.textContent !== value) output.textContent = value
    }
    const updateReadings = () => {
      if (!current()) return
      doc.querySelectorAll<HTMLElement>('[data-font-status]').forEach(output => {
        const family = output.dataset.fontStatus!
        const faces = [...doc.fonts].filter(face => face.family.replace(/^["']|["']$/g, '') === family)
        writeReading(output, faces.some(face => face.status === 'loaded') ? 'Loaded'
          : faces.some(face => face.status === 'loading') ? 'Loading…' : 'Unavailable · fallback')
      })
      doc.querySelectorAll<HTMLElement>('[data-size-readout]').forEach(output => {
        const element = doc.getElementById(output.dataset.sizeReadout!)
        if (!element) return
        const box = element.getBoundingClientRect()
        writeReading(output, `${Math.round(box.width * 10) / 10} × ${Math.round(box.height * 10) / 10} px`)
      })
      doc.querySelectorAll<HTMLElement>('[data-layout-axis]').forEach(output => {
        const element = doc.getElementById(output.dataset.layoutAxis!)
        if (!element) return
        const style = view.getComputedStyle(element)
        writeReading(output, style.display.includes('flex')
          ? `Main axis · ${style.flexDirection.startsWith('row') ? 'inline' : 'block'}${style.flexDirection.endsWith('reverse') ? ' · reversed' : ''}`
          : style.display.includes('grid') ? 'Grid auto-placement' : 'Normal block flow')
      })
      doc.querySelectorAll<HTMLElement>('[data-alignment-axis]').forEach(output => {
        const element = doc.getElementById(output.dataset.alignmentAxis!)
        if (!element) return
        const style = view.getComputedStyle(element)
        const main = style.display.includes('flex') && style.flexDirection.startsWith('column') ? 'block' : 'inline'
        const cross = main === 'inline' ? 'block' : 'inline'
        writeReading(output, output.dataset.axisKind === 'both' ? `${cross} + ${main} axes` : `${output.dataset.axisKind === 'cross' ? cross : main} axis`)
      })
      doc.querySelectorAll<HTMLElement>('[data-style-readout]').forEach(output => {
        const element = doc.getElementById(output.dataset.styleReadout!)
        if (!element) return
        const value = view.getComputedStyle(element, output.dataset.stylePseudo || null).getPropertyValue(output.dataset.styleProperty!)
        if (output.hasAttribute('data-round-pixels')) {
          output.title = value
          writeReading(output, (value || output.dataset.emptyValue || '').replace(/(-?\d*\.?\d+)px\b/g, (_, number: string) => `${Math.round(Number(number) * 10) / 10}px`))
        } else writeReading(output, value || output.dataset.emptyValue || '')
      })
      doc.querySelectorAll<HTMLElement>('[data-position-readout]').forEach(output => {
        const element = doc.getElementById(output.dataset.positionReadout!)
        const origin = doc.getElementById(output.dataset.positionOrigin!)
        if (!element || !origin) return
        const box = element.getBoundingClientRect(), parent = origin.getBoundingClientRect()
        writeReading(output, `x ${Math.round((box.left - parent.left - origin.clientLeft) * 10) / 10} · y ${Math.round((box.top - parent.top - origin.clientTop) * 10) / 10} px`)
      })
      doc.querySelectorAll<HTMLElement>('[data-scroll-readout]').forEach(output => {
        const element = doc.getElementById(output.dataset.scrollReadout!)
        if (element) writeReading(output, `x ${Math.round(element.scrollLeft)} · y ${Math.round(element.scrollTop)} px`)
      })
      doc.querySelectorAll<HTMLElement>('[data-scroll-offset]').forEach(output => {
        const target = doc.getElementById(output.dataset.scrollOffset!)
        const port = doc.getElementById(output.dataset.scrollport!)
        if (!target || !port) return
        const box = target.getBoundingClientRect(), container = port.getBoundingClientRect()
        const offset = output.dataset.scrollAxis === 'x' ? box.left - container.left - port.clientLeft : box.top - container.top - port.clientTop
        writeReading(output, `${Math.round(offset)} px`)
      })
    }
    const update = () => {
      if (!current()) return
      updateReadings()
      if (sizing === 'content') {
        // The root's normal-flow box includes collapsed body/child margins.
        // scrollHeight is at least the current viewport and cannot shrink it.
        setContentHeight(Math.max(96, Math.ceil(doc.documentElement.getBoundingClientRect().height)))
      }
      setFitWidth(Math.round(frame.clientWidth))
      setMinimumWidth(Math.min(240, bodyRef.current?.clientWidth ?? 240, maxWidth))
      const target = doc.querySelector('[data-target]')
      if (target && inspect?.length) {
        const computed = view.getComputedStyle(target)
        setProperties(inspect.map(name => `${name}: ${computed.getPropertyValue(name)}`).join(' · '))
      }
    }
    applyTheme()
    update()
    const themeObserver = new MutationObserver(() => { applyTheme(); update() })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(frame)
    if (bodyRef.current) resizeObserver.observe(bodyRef.current)
    if (sizing === 'content') {
      resizeObserver.observe(doc.body)
      resizeObserver.observe(doc.documentElement)
    }
    doc.querySelectorAll<HTMLElement>('[data-size-readout]').forEach(output => {
      const element = doc.getElementById(output.dataset.sizeReadout!)
      if (element) resizeObserver.observe(element)
    })
    const controller = motion || doc.querySelector('[data-animation-readout]') ? demoPlayback(doc, motion, setPlaying, update) : null
    const disposeDragReadings = doc.querySelector('[data-drag-readout]') ? demoDragReadings(doc) : undefined
    playback.current = controller
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const preferenceChanged = () => {
      // Only playback-controlled demos own their animations. Native transitions
      // follow the authored media queries and must be allowed to finish.
      if (motion) controller?.pause()
      if (controller) controller.refresh()
      else update()
    }
    preference.addEventListener('change', preferenceChanged)
    doc.addEventListener('scroll', updateReadings, true)
    doc.fonts.addEventListener('loadingdone', update)
    doc.fonts.addEventListener('loadingerror', update)
    const events = ['pointerover', 'pointerout', 'pointerdown', 'pointerup', 'focusin', 'focusout', 'input', 'click', 'transitionend', 'transitioncancel']
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const afterEvent = () => {
      if (!current()) return
      const timer = setTimeout(() => { update(); timers.delete(timer) }, 50)
      timers.add(timer)
    }
    events.forEach(event => doc.addEventListener(event, afterEvent))
    const click = (event: MouseEvent) => {
      if (!current()) return
      const target = (event.target as Element).closest<HTMLElement>('[data-scroll-to]')
      if (target) {
        if (target.matches('a')) event.preventDefault()
        const destination = doc.getElementById(target.dataset.scrollTo!)
        if (destination) {
          const alignment = view.getComputedStyle(destination).scrollSnapAlign.split(' ')
          const edge = (value: string): ScrollLogicalPosition => value === 'center' || value === 'end' ? value : 'start'
          const options: ScrollIntoViewOptions & { container: 'nearest' } = {
            block: edge(alignment[0]), inline: edge(alignment[1] ?? alignment[0]), container: 'nearest',
          }
          // Safari versions that ignore (container:nearest) also scroll the host page.
          // Restore only host ancestors; the specimen keeps its native CSS alignment.
          const ancestors: { element: HTMLElement, top: number, left: number }[] = []
          for (let element = frame.parentElement; element; element = element.parentElement) {
            if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth) {
              ancestors.push({ element, top: element.scrollTop, left: element.scrollLeft })
            }
          }
          destination.scrollIntoView(options)
          ancestors.forEach(({ element, top, left }) => element.scrollTo({ top, left, behavior: 'instant' }))
        }
      }
      const advance = (event.target as Element).closest<HTMLElement>('[data-scroll-by]')
      if (advance) {
        const container = doc.getElementById(advance.dataset.scrollBy!)
        const distance = Number(advance.dataset.scrollDistance)
        if (container && Number.isFinite(distance)) container.scrollBy({ left: distance, behavior: 'instant' })
      }
      const scrollButton = (event.target as Element).closest<HTMLElement>('[data-scroll-container]')
      if (scrollButton) {
        const container = doc.getElementById(scrollButton.dataset.scrollContainer!)
        const end = scrollButton.dataset.scrollEdge === 'end'
        container?.scrollTo({ top: end ? container.scrollHeight : 0, left: end ? container.scrollWidth : 0, behavior: 'instant' })
      }
    }
    doc.addEventListener('click', click)
    setReady(true)
    cleanup.current = () => {
      active = false
      themeObserver.disconnect()
      resizeObserver.disconnect()
      preference.removeEventListener('change', preferenceChanged)
      doc.removeEventListener('scroll', updateReadings, true)
      doc.fonts.removeEventListener('loadingdone', update)
      doc.fonts.removeEventListener('loadingerror', update)
      events.forEach(event => doc.removeEventListener(event, afterEvent))
      doc.removeEventListener('click', click)
      timers.forEach(clearTimeout)
      controller?.dispose()
      disposeDragReadings?.()
      if (playback.current === controller) playback.current = null
    }
  }, [dark, inspect, maxWidth, motion, sizing])

  useEffect(() => {
    load()
    return () => cleanup.current()
  }, [load])

  const animate = (action: PlaybackAction) => playback.current?.act(action)
  const range = { min: minimumWidth, max: Math.max(minimumWidth, maxWidth), value: width ?? fitWidth }
  /** The handle mirrors the range input for pointers; the input stays the keyboard control. */
  const drag = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const handle = event.currentTarget
    const viewport = handle.parentElement!
    const start = { x: event.clientX, width: viewport.getBoundingClientRect().width }
    // A centered viewport grows on both sides, so its edge moves at half the width change.
    const scale = start.width < bodyRef.current!.clientWidth - 1 ? 2 : 1
    handle.setPointerCapture(event.pointerId)
    const move = (next: PointerEvent) => setWidth(Math.round(Math.min(range.max, Math.max(range.min, start.width + (next.clientX - start.x) * scale))))
    const end = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', end)
      handle.removeEventListener('pointercancel', end)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', end)
    handle.addEventListener('pointercancel', end)
  }
  const button = { type: 'button', disabled: !ready, className: 'ui-button', 'data-size': 'sm' } as const

  return (
    <div className="ui-browser" data-variant={chrome ? undefined : 'plain'} data-ready={ready}>
      {chrome && <div className="ui-browser-bar" aria-hidden="true"><span className="ui-browser-dots"><i /><i /><i /></span></div>}
      <div ref={bodyRef} className="ui-browser-body">
        <div className="ui-browser-viewport" style={{ width: width ? `${width}px` : `min(100%, ${maxWidth}px)` }}>
          <iframe ref={ref} title={title} srcDoc={source} src={src} loading="lazy" data-ready={ready} data-sizing={sizing}
            style={{ height: sizing === 'content' ? contentHeight ?? height : height }} onLoad={load} />
          {responsive && <span className="ui-resize" aria-hidden="true" onPointerDown={drag} />}
        </div>
      </div>
      {(responsive || motion || print || theme || Boolean(inspect?.length)) && (
        <div className="ui-browser-tools" role="group" aria-label={`${title} controls`}>
          {responsive && <>
            {Boolean(widthPresets?.length) && <div className="ui-segmented" role="group" aria-label="Viewport presets">
              {widthPresets?.map(preset => <button key={preset.label} type="button" disabled={!ready}
                aria-pressed={width === preset.width} onClick={() => setWidth(preset.width)}>{preset.label}</button>)}
            </div>}
            <label className="ui-label" data-case="as-is" htmlFor={widthId}>Viewport</label>
            <input id={widthId} className="ui-range" disabled={!ready} type="range" min={range.min} max={range.max} step="1" value={range.value}
              style={{ '--value': `${((range.value - range.min) / Math.max(1, range.max - range.min)) * 100}%` } as CSSProperties}
              onChange={event => setWidth(Number(event.target.value))} />
            {ready && <output className="ui-browser-size" htmlFor={widthId}>{fitWidth} px</output>}
            <button {...button} onClick={() => setWidth(undefined)}>Fit</button>
          </>}
          {theme && <button {...button} aria-pressed={isDark} title="Toggle dark theme" onClick={() => setDark(!isDark)}>
            {isDark ? <IconMoon aria-hidden="true" /> : <IconSun aria-hidden="true" />}Theme
          </button>}
          {motion && <>
            <button {...button} onClick={() => animate(playing ? 'pause' : 'play')}>
              {playing ? <IconPlayerPause aria-hidden="true" /> : <IconPlayerPlay aria-hidden="true" />}{playing ? 'Pause' : 'Play'}
            </button>
            <button {...button} data-variant="quiet" onClick={() => animate('restart')}><IconRefresh aria-hidden="true" />Replay</button>
          </>}
          {print && <button {...button} onClick={() => ref.current?.contentWindow?.print()}><IconPrinter aria-hidden="true" />Print preview</button>}
          {properties && <output aria-live="polite">{properties}</output>}
        </div>
      )}
    </div>
  )
}
