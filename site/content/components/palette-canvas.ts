/** A demand-rendered, wide-gamut palette. Only a short change of projection owns an animation frame. */
interface Point { x: number, y: number }
interface Swatch { element: HTMLElement, color: string, chroma: number, column: number, row: number }
interface Hit { index: number, points: Point[] }

export interface PaletteCanvas {
  select: (element: HTMLElement | null) => void
  keyboard: () => void
  refresh: () => void
  dispose: () => void
}

export function mountPaletteCanvas(stage: HTMLElement, canvas: HTMLCanvasElement, pick: (element: HTMLElement | null) => void): PaletteCanvas | undefined {
  // A browser without P3 canvas support still gets its default sRGB context and the same CSS colors.
  let context: CanvasRenderingContext2D | null
  try {
    context = canvas.getContext('2d', { colorSpace: 'display-p3', alpha: false })
  } catch {
    context = canvas.getContext('2d', { alpha: false })
  }
  if (!context) return
  const ctx = context
  const swatches: Swatch[] = [...stage.querySelectorAll<HTMLElement>('[data-token]')].map((element) => ({
    element, color: element.dataset.value!, chroma: Number(element.dataset.chroma),
    column: Number(element.dataset.column), row: Number(element.dataset.row)
  }))
  const columns = Math.max(...swatches.map((swatch) => swatch.column)) + 1
  const rows = Math.max(...swatches.map((swatch) => swatch.row)) + 1
  const names = [...stage.querySelectorAll<HTMLElement>('.home-palette-name')].slice(1).map((element) => element.textContent!)
  const tiers = [...stage.querySelectorAll<HTMLElement>('.home-palette-tier')].map((element) => element.textContent!)
  // Low columns at the back first; front bars are painted last, without a depth buffer.
  const order = swatches.map((swatch, index) => ({ swatch, index })).sort((a, b) => (a.swatch.row - b.swatch.row) || (b.swatch.column - a.swatch.column))
  const narrow = matchMedia('(width < 64rem)')
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const scheme = matchMedia('(prefers-color-scheme: dark)')
  let width = 0, height = 0, density = 1, frame = 0
  let visible = false, hovered = false, selected = -1
  let flat = narrow.matches ? 1 : 0, target = flat, from = flat, started = 0
  let hits: Hit[] = [], pointer: Point | undefined, touchStart: Point | undefined
  let colors = { ink: '', ground: '', line: '', signal: '', tag: '', tagText: '', font: '' }

  function polygon(points: Point[]) {
    const path = new Path2D()
    path.moveTo(points[0].x, points[0].y)
    for (const point of points.slice(1)) path.lineTo(point.x, point.y)
    path.closePath()
    return path
  }

  function hitTest(point: Point) {
    // Painter order is reversed, so a raised top takes precedence over the top behind it.
    for (let i = hits.length - 1; i >= 0; i--) {
      const { points, index } = hits[i]
      const inside = points.every((a, j) => {
        const b = points[(j + 1) % points.length]
        return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x) >= 0
      })
      if (inside) return swatches[index].element
    }
    return null
  }

  function draw() {
    if (!width || !height) return
    ctx.setTransform(density, 0, 0, density, 0, 0)
    ctx.fillStyle = colors.ground
    ctx.fillRect(0, 0, width, height)
    const tilt = (1 - flat) * 56 * Math.PI / 180
    const turn = (1 - flat) * -28 * Math.PI / 180
    const cosTurn = Math.cos(turn), sinTurn = Math.sin(turn), cosTilt = Math.cos(tilt), sinTilt = Math.sin(tilt)
    const cellW = 42
    // On phones a readable flat table needs taller cells, rather than a uniformly shrunken 3D field.
    const cellH = narrow.matches ? (height - 100) * columns * cellW / (rows * (width - 48)) : 27
    const gridW = columns * cellW, gridH = rows * cellH
    const project = (x: number, y: number, z = 0): Point => ({
      x: cosTurn * x - sinTurn * y,
      y: cosTilt * (sinTurn * x + cosTurn * y) - sinTilt * z
    })
    const corners = [project(-gridW / 2, -gridH / 2), project(gridW / 2, -gridH / 2), project(gridW / 2, gridH / 2), project(-gridW / 2, gridH / 2)]
    const minX = Math.min(...corners.map((p) => p.x)), maxX = Math.max(...corners.map((p) => p.x))
    const minY = Math.min(...corners.map((p) => p.y)), maxY = Math.max(...corners.map((p) => p.y))
    const scale = Math.min((width - (narrow.matches ? 48 : 92)) / (maxX - minX), (height - 100) / (maxY - minY), 1.3)
    const gap = narrow.matches ? Math.max(3, 2 / scale) : 3
    const point = (x: number, y: number, z = 0): Point => {
      const p = project(x, y, z)
      return { x: width / 2 + p.x * scale, y: height / 2 + 12 + (p.y - (maxY + minY) / 2) * scale }
    }
    const floor = polygon([
      point(-gridW / 2 - 8, -gridH / 2 - 8), point(gridW / 2 + 8, -gridH / 2 - 8),
      point(gridW / 2 + 8, gridH / 2 + 8), point(-gridW / 2 - 8, gridH / 2 + 8)
    ])
    if (flat < 1) {
      ctx.save()
      ctx.shadowColor = 'rgb(0 0 0 / .12)'
      ctx.shadowBlur = 22 * (1 - flat)
      ctx.shadowOffsetY = 10 * (1 - flat)
      ctx.fillStyle = colors.ground
      ctx.fill(floor)
      ctx.restore()
      ctx.strokeStyle = colors.line
      ctx.lineWidth = .75
      ctx.stroke(floor)
    }
    hits = []
    for (const { swatch, index } of order) {
      const x = swatch.column * cellW - gridW / 2, y = swatch.row * cellH - gridH / 2
      const lift = swatch.chroma * 180 * (1 - flat)
      const top = [point(x, y, lift), point(x + cellW - gap, y, lift), point(x + cellW - gap, y + cellH - gap, lift), point(x, y + cellH - gap, lift)]
      if (lift > .1) {
        const left = polygon([top[0], top[3], point(x, y + cellH - gap), point(x, y)])
        const front = polygon([top[3], top[2], point(x + cellW - gap, y + cellH - gap), point(x, y + cellH - gap)])
        ctx.fillStyle = swatch.color
        ctx.fill(left)
        ctx.fill(front)
        ctx.fillStyle = 'rgb(0 0 0 / .28)'
        ctx.fill(left)
        ctx.fillStyle = 'rgb(0 0 0 / .16)'
        ctx.fill(front)
      }
      const path = polygon(top)
      ctx.fillStyle = swatch.color
      ctx.fill(path)
      ctx.lineWidth = .6
      ctx.strokeStyle = 'rgb(0 0 0 / .09)'
      ctx.stroke(path)
      hits.push({ index, points: top })
    }
    // Labels enter with the flat table. The tier ruler remains readable on small screens.
    if (flat > .8) {
      ctx.globalAlpha = (flat - .8) * 5
      ctx.fillStyle = colors.ink
      ctx.font = `${narrow.matches ? 9 : 10}px ${colors.font}`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      for (let row = 0; row < rows; row++) {
        const p = point(-gridW / 2, row * cellH - gridH / 2 + (cellH - gap) / 2)
        ctx.fillText(tiers[row], p.x - 8, p.y)
      }
      if (!narrow.matches) {
        ctx.textAlign = 'center'
        for (let col = 0; col < columns; col++) {
          const p = point(col * cellW - gridW / 2 + (cellW - gap) / 2, -gridH / 2)
          ctx.fillText(names[col], p.x, p.y - 16)
        }
      }
      ctx.globalAlpha = 1
    }
    if (selected >= 0) {
      const hit = hits.find((entry) => entry.index === selected)!
      ctx.strokeStyle = colors.signal
      ctx.lineWidth = 2
      ctx.stroke(polygon(hit.points))
      // A class tag stays in screen coordinates and within the canvas, including the outer columns.
      if (flat > .9) {
        const token = swatches[selected].element.dataset.token!
        ctx.font = `11px ${colors.font}`
        const tagW = ctx.measureText(token).width + 16
        const x = Math.max(8, Math.min(width - tagW - 8, hit.points[0].x))
        const y = hit.points[0].y - 29
        ctx.fillStyle = colors.tag
        ctx.beginPath()
        ctx.roundRect(x, y, tagW, 22, 4)
        ctx.fill()
        ctx.fillStyle = colors.tagText
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(token, x + 8, y + 11)
      }
    }
    // Reveal the canvas only after its first complete frame; the native table covers hydration.
    stage.parentElement!.dataset.renderer = 'canvas'
    stage.dataset.projection = flat > .99 ? 'flat' : 'raised'
    if (pointer) pick(hitTest(pointer))
  }

  function tick(now: number) {
    frame = 0
    const progress = reduced.matches ? 1 : Math.min(1, (now - started) / 680)
    flat = from + (target - from) * (1 - (1 - progress) ** 4)
    draw()
    if (progress < 1 && flat !== target) request()
  }

  function request() {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick)
  }

  function refresh() {
    const next = narrow.matches || hovered || stage.matches(':focus-visible') || (selected >= 0 && !pointer) ? 1 : 0
    if (next !== target) {
      from = flat
      target = next
      started = performance.now()
    }
    if (reduced.matches) flat = from = target
    request()
  }

  function resize() {
    const rect = stage.getBoundingClientRect()
    width = rect.width
    height = rect.height
    density = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * density)
    canvas.height = Math.round(height * density)
    theme()
    refresh()
  }

  function theme() {
    const css = getComputedStyle(canvas)
    colors = { ink: css.color, ground: css.backgroundColor, line: css.borderTopColor, signal: css.caretColor, tag: css.outlineColor, tagText: css.textDecorationColor, font: css.fontFamily }
    request()
  }

  function position(event: PointerEvent): Point {
    const rect = canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function enter(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return
    hovered = true
    refresh()
  }

  function move(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return
    pointer = position(event)
    pick(hitTest(pointer))
  }

  function leave(event: PointerEvent) {
    // Touch emits pointerleave after lifting; retain the tapped swatch and its readout.
    if (event.pointerType !== 'mouse') return
    hovered = false
    pointer = undefined
    if (!stage.matches(':focus-visible')) pick(null)
    refresh()
  }

  function down(event: PointerEvent) {
    if (event.pointerType !== 'mouse') touchStart = position(event)
  }

  function up(event: PointerEvent) {
    if (event.pointerType === 'mouse' || !touchStart) return
    const p = position(event)
    if (Math.hypot(p.x - touchStart.x, p.y - touchStart.y) < 8) pick(hitTest(p))
    touchStart = undefined
    refresh()
  }

  function cancel() { touchStart = undefined }
  function visibility() {
    if (document.hidden) {
      cancelAnimationFrame(frame)
      frame = 0
    } else refresh()
  }

  const resizeObserver = new ResizeObserver(resize)
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) refresh()
    else { cancelAnimationFrame(frame); frame = 0 }
  })
  const themeObserver = new MutationObserver(theme)
  resizeObserver.observe(stage)
  intersection.observe(stage)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] })
  narrow.addEventListener('change', resize)
  reduced.addEventListener('change', refresh)
  scheme.addEventListener('change', theme)
  document.addEventListener('visibilitychange', visibility)
  const listeners = { pointerenter: enter, pointermove: move, pointerleave: leave, pointerdown: down, pointerup: up, pointercancel: cancel }
  for (const [name, listener] of Object.entries(listeners)) stage.addEventListener(name, listener as EventListener)
  resize()
  return {
    keyboard() { pointer = undefined },
    select(element) {
      const next = swatches.findIndex((swatch) => swatch.element === element)
      if (selected === next) return
      selected = next
      refresh()
    },
    refresh,
    dispose() {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      intersection.disconnect()
      themeObserver.disconnect()
      narrow.removeEventListener('change', resize)
      reduced.removeEventListener('change', refresh)
      scheme.removeEventListener('change', theme)
      document.removeEventListener('visibilitychange', visibility)
      for (const [name, listener] of Object.entries(listeners)) stage.removeEventListener(name, listener as EventListener)
      delete stage.parentElement!.dataset.renderer
    }
  }
}
