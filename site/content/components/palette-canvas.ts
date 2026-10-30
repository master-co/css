import { paletteGeometry, paletteHit, type PaletteGeometry, type PalettePoint } from './palette-geometry'
import { paintPaletteField, paintPaletteSelection, type PaletteColor, type PalettePaints } from './palette-painter'

export interface PaletteCanvas {
  select: (element: HTMLElement | null, pinned?: boolean) => void
  keyboard: () => void
  dispose: () => void
}

interface PaletteCallbacks {
  preview: (element: HTMLElement | null) => void
  choose: (element: HTMLElement) => void
}

function context2D(canvas: HTMLCanvasElement) {
  try {
    return canvas.getContext('2d', { colorSpace: 'display-p3', alpha: false })
  } catch {
    return canvas.getContext('2d', { alpha: false })
  }
}

/** A cached field with a small selection pass. A finite projection change is its only animation. */
export function mountPaletteCanvas(stage: HTMLElement, canvas: HTMLCanvasElement, callbacks: PaletteCallbacks): PaletteCanvas | undefined {
  const context = context2D(canvas)
  const buffer = document.createElement('canvas')
  buffer.dataset.homePaletteCache = ''
  const bufferContext = context2D(buffer)
  if (!context || !bufferContext) return
  const ctx = context, base = bufferContext
  const colors: (PaletteColor & { element: HTMLElement })[] = [...stage.querySelectorAll<HTMLElement>('[data-token]')].map((element) => ({
    element, token: element.dataset.token!, value: element.dataset.value!,
    name: element.dataset.name!, tier: element.dataset.tier!,
    chroma: Number(element.dataset.chroma), column: Number(element.dataset.column), row: Number(element.dataset.row)
  }))
  const columns = Math.max(...colors.map((color) => color.column)) + 1
  const rows = Math.max(...colors.map((color) => color.row)) + 1
  const names = [...stage.querySelectorAll<HTMLElement>('.home-palette-name')].slice(1).map((element) => element.textContent!)
  const tiers = [...stage.querySelectorAll<HTMLElement>('.home-palette-tier')].map((element) => element.textContent!)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const compact = matchMedia('(width < 64rem)')
  const scheme = matchMedia('(prefers-color-scheme: dark)')
  let width = 0, height = 0, density = 1, frame = 0, readoutInset = 76
  let visible = false, drawing = false, baseDirty = true, selectionDirty = true
  let selected = -1, pinned = false, hovered = stage.matches(':hover')
  let flat = compact.matches || hovered || stage.matches(':focus-visible') || stage.parentElement!.hasAttribute('data-pinned') ? 1 : 0
  let target = flat, from = flat, started = 0
  let geometry: PaletteGeometry | undefined, paints: PalettePaints
  let pointer: PalettePoint | undefined, pointerDirty = false, lastPreview: number | undefined
  let gesture: { id: number, start: PalettePoint, scrubbing: boolean } | undefined

  function schedule() {
    if (!frame && !drawing && visible && !document.hidden) frame = requestAnimationFrame(tick)
  }

  function preview(point: PalettePoint) {
    const index = geometry ? paletteHit(geometry, point) : undefined
    if (index === lastPreview) return
    lastPreview = index
    callbacks.preview(index === undefined ? null : colors[index].element)
  }

  function tick(now: number) {
    frame = 0
    drawing = true
    if (flat !== target) {
      const progress = reduced.matches ? 1 : Math.min(1, (now - started) / 620)
      flat = progress === 1 ? target : from + (target - from) * (1 - (1 - progress) ** 4)
      baseDirty = true
    }
    if (!width || !height) { drawing = false; return }
    const pixelWidth = Math.max(1, Math.round(width * density)), pixelHeight = Math.max(1, Math.round(height * density))
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = buffer.width = pixelWidth
      canvas.height = buffer.height = pixelHeight
      baseDirty = true
    }
    if (baseDirty) {
      geometry = paletteGeometry(width, height, flat, colors, columns, rows, readoutInset)
      base.setTransform(density, 0, 0, density, 0, 0)
      paintPaletteField(base, width, height, geometry, colors, paints, names, tiers)
      baseDirty = false
      selectionDirty = true
      if (pointer) pointerDirty = true
    }
    // Let the field settle under the pointer before naming a cell; the camera move never churns the readout.
    if (pointerDirty && pointer && flat > .98) {
      preview(pointer)
      pointerDirty = false
    }
    if (selectionDirty) {
      ctx.setTransform(density, 0, 0, density, 0, 0)
      ctx.drawImage(buffer, 0, 0, buffer.width, buffer.height, 0, 0, width, height)
      if (selected >= 0) {
        const cell = geometry!.cells.find((cell) => cell.index === selected)!
        paintPaletteSelection(ctx, width, geometry!, cell, colors[selected], paints)
        canvas.dataset.active = colors[selected].token
      } else delete canvas.dataset.active
      selectionDirty = false
    }
    // The native table covers hydration until a complete frame is available.
    stage.parentElement!.dataset.renderer = 'canvas'
    stage.dataset.projection = flat === 1 ? 'flat' : flat === 0 ? 'raised' : 'changing'
    drawing = false
    if (flat !== target) schedule()
  }

  function readPaints() {
    const css = getComputedStyle(canvas)
    paints = {
      ground: css.backgroundColor, sheet: css.textDecorationColor,
      ink: css.columnRuleColor, muted: css.color, line: css.borderTopColor,
      signal: css.caretColor, inverse: css.borderBottomColor,
      font: css.fontFamily
    }
    baseDirty = true
    schedule()
  }

  function resize() {
    const rect = stage.getBoundingClientRect()
    width = rect.width
    height = rect.height
    readoutInset = readout ? rect.bottom - readout.getBoundingClientRect().top + 16 : 76
    // Keep both raster surfaces together below 5.2 million pixels, including very wide retina displays.
    density = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2_600_000 / Math.max(1, width * height)))
    readPaints()
  }

  function position(event: PointerEvent): PalettePoint {
    const rect = stage.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function refreshProjection() {
    const next = compact.matches || hovered || pinned || stage.matches(':focus-visible') ? 1 : 0
    if (next === target) return
    from = flat
    target = next
    started = performance.now()
    if (reduced.matches) flat = target
    baseDirty = true
    schedule()
  }

  function enter(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return
    hovered = true
    refreshProjection()
  }

  function choose(point: PalettePoint) {
    const index = geometry ? paletteHit(geometry, point) : undefined
    if (index !== undefined) callbacks.choose(colors[index].element)
  }

  function move(event: PointerEvent) {
    if (!event.isPrimary) return
    const point = position(event)
    if (event.pointerType === 'mouse') {
      pointer = point
      pointerDirty = true
      schedule()
      return
    }
    if (!gesture || gesture.id !== event.pointerId) return
    const dx = Math.abs(point.x - gesture.start.x), dy = Math.abs(point.y - gesture.start.y)
    if (!gesture.scrubbing && dx > 8 && dx > dy * 1.3) {
      gesture.scrubbing = true
      stage.setPointerCapture(event.pointerId)
      stage.dataset.scrubbing = ''
    }
    if (gesture.scrubbing) choose(point)
  }

  function leave(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return
    hovered = false
    pointer = undefined
    pointerDirty = false
    lastPreview = undefined
    callbacks.preview(null)
    refreshProjection()
  }

  function down(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0 || event.pointerType === 'mouse') return
    const point = position(event)
    gesture = { id: event.pointerId, start: point, scrubbing: false }
  }

  function finishGesture() {
    if (gesture && stage.hasPointerCapture(gesture.id)) stage.releasePointerCapture(gesture.id)
    gesture = undefined
    delete stage.dataset.scrubbing
  }

  function up(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0) return
    const point = position(event)
    if (event.pointerType === 'mouse') choose(point)
    else if (gesture?.id === event.pointerId) {
      if (gesture.scrubbing || Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y) < 8) choose(point)
      finishGesture()
    }
  }

  function visibility() {
    if (document.hidden) {
      cancelAnimationFrame(frame)
      frame = 0
      finishGesture()
    } else schedule()
  }

  function motion() {
    if (reduced.matches && flat !== target) {
      flat = target
      baseDirty = true
      schedule()
    }
  }

  const readout = stage.parentElement!.querySelector<HTMLElement>('.home-palette-inspector')
  const resizeObserver = new ResizeObserver(resize)
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) schedule()
    else {
      cancelAnimationFrame(frame)
      frame = 0
      finishGesture()
    }
  })
  const themeObserver = new MutationObserver(readPaints)
  resizeObserver.observe(stage)
  if (readout) resizeObserver.observe(readout)
  intersection.observe(stage)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] })
  reduced.addEventListener('change', motion)
  compact.addEventListener('change', refreshProjection)
  scheme.addEventListener('change', readPaints)
  document.addEventListener('visibilitychange', visibility)
  document.fonts.addEventListener('loadingdone', readPaints)
  const listeners = { pointerenter: enter, pointermove: move, pointerleave: leave, pointerdown: down, pointerup: up, pointercancel: finishGesture, lostpointercapture: finishGesture, focus: refreshProjection, blur: refreshProjection }
  for (const [name, listener] of Object.entries(listeners)) stage.addEventListener(name, listener as EventListener)
  resize()
  return {
    keyboard() {
      pointer = undefined
      pointerDirty = false
      lastPreview = undefined
      refreshProjection()
    },
    select(element, keep = false) {
      const next = colors.findIndex((color) => color.element === element)
      if (next === selected && keep === pinned) return
      selected = next
      pinned = keep
      selectionDirty = true
      refreshProjection()
      schedule()
    },
    dispose() {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      intersection.disconnect()
      themeObserver.disconnect()
      reduced.removeEventListener('change', motion)
      compact.removeEventListener('change', refreshProjection)
      scheme.removeEventListener('change', readPaints)
      document.removeEventListener('visibilitychange', visibility)
      document.fonts.removeEventListener('loadingdone', readPaints)
      for (const [name, listener] of Object.entries(listeners)) stage.removeEventListener(name, listener as EventListener)
      finishGesture()
      buffer.width = buffer.height = 1
      delete stage.parentElement!.dataset.renderer
    }
  }
}
