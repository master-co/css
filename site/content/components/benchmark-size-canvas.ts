/**
 * The CSS size chart's graphics on one 2D canvas: hatched tracks, brand bars, the Master CSS silk ribbon with
 * its travelling satin, dashed gridlines and the ruler. Names, values and axis labels stay in the DOM above the
 * canvas, so they remain crisp and are read by screen readers; the painter only moves and counts them.
 */

export type BenchmarkCurve = readonly [number, number, number, number]

/** The bars' curve. The readouts count along it, so every number lands with its bar. */
export const benchmarkCurve: BenchmarkCurve = [0.22, 1, 0.36, 1]
/** `--home-ease-inout`: the satin's sweep along the ribbon. */
const satinCurve: BenchmarkCurve = [0.65, 0, 0.35, 1]

export const benchmarkMotion = {
  /** Every bar starts from this share of the axis and counts down to its own size. */
  startPercent: 90,
  introSeconds: 3,
  rowDelay: 0.085,
  ratioFade: 0.24,
  switchSeconds: 1.1,
  switchRowDelay: 0.035,
  /** The satin sets off once the bars are this far into their run, and leaves the ribbon as the last one lands. */
  satinLead: 0.3
} as const

const axisTickTarget = 4
const minorTicks = 4
/** Device pixels the canvas may hold; very wide or dense screens trade a little density for memory. */
const pixelBudget = 3_200_000
const barRadius = 3

/** A CSS cubic-bezier timing function, evaluated in script. */
export function cubicBezier([x1, y1, x2, y2]: BenchmarkCurve, x: number) {
  if (x <= 0 || x >= 1) return Math.min(1, Math.max(0, x))
  const axis = (t: number, p1: number, p2: number) => ((1 - 3 * p2 + 3 * p1) * t + (3 * p2 - 6 * p1)) * t * t + 3 * p1 * t
  let t = x
  for (let index = 0; index < 8; index++) {
    const slope = (3 * (1 - 3 * x2 + 3 * x1) * t + 2 * (3 * x2 - 6 * x1)) * t + 3 * x1
    if (Math.abs(slope) < 1e-6) break
    t -= (axis(t, x1, x2) - x) / slope
  }
  return axis(Math.min(1, Math.max(0, t)), y1, y2)
}

/** A row's eased progress: zero until its delay passes, one once its duration has run. */
export function easedProgress(elapsed: number, delay: number, duration: number) {
  if (duration <= 0) return 1
  return cubicBezier(benchmarkCurve, Math.min(1, Math.max(0, (elapsed - delay) / duration)))
}

/** The intro's bar duration, leaving the last row's ratio time to appear within the whole intro. */
export function introSeconds(rows: number) {
  const { introSeconds: total, ratioFade, rowDelay } = benchmarkMotion
  return Math.max(1.2, total - Math.max(0, rows - 1) * rowDelay - ratioFade)
}

export const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress

export function toPercent(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0
  return Math.max(0, Math.min(100, value / max * 100))
}

export interface BenchmarkAxisTick {
  label: string
  percent: number
}

export interface BenchmarkAxis {
  maxBytes: number
  ticks: BenchmarkAxisTick[]
}

const axisFormats = [0, 1].map((digits) => new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }))
const kilobyteFormat = axisFormats[1]

/** A ruler with round steps that leaves `headroom` past the longest bar for its readout. */
export function createBenchmarkAxis(maxBytes: number, headroom: number, tickTarget = axisTickTarget): BenchmarkAxis {
  const maxKilobytes = Math.max(1, maxBytes / 1000)
  const step = niceStep(maxKilobytes / tickTarget)
  const axisMaxKilobytes = Math.ceil(maxKilobytes * headroom / step) * step
  const ticks: BenchmarkAxisTick[] = []
  for (let value = 0; value <= axisMaxKilobytes + step / 2; value += step) {
    ticks.push({ label: axisFormats[value >= 10 ? 0 : 1].format(value), percent: toPercent(value, axisMaxKilobytes) })
  }
  // Only the last tick carries the unit, so narrow axes keep their labels apart.
  ticks[ticks.length - 1].label += ' kB'
  return { maxBytes: axisMaxKilobytes * 1000, ticks }
}

function niceStep(target: number) {
  const magnitude = 10 ** Math.floor(Math.log10(target))
  const normalized = target / magnitude
  if (normalized <= 1) return magnitude
  if (normalized <= 2) return 2 * magnitude
  if (normalized <= 5) return 5 * magnitude
  return 10 * magnitude
}

export function formatKilobytes(bytes: number) {
  return `${kilobyteFormat.format(bytes / 1000)} kB`
}

/**
 * Where the satin's centre is along the ribbon (0 to 1 is on it) at `elapsed` into a run, or undefined outside
 * its pass. It crosses once per run, from just off the zero edge to just past the end, so nothing loops at rest.
 */
export function satinCenter(elapsed: number, start: number, end: number) {
  if (!(end > start) || elapsed < start || elapsed >= end) return undefined
  return -0.5 + 2 * cubicBezier(satinCurve, (elapsed - start) / (end - start))
}

/**
 * The readout's shift from its settled place: it rides the bar's end, but never past the plot's right edge,
 * so a long starting bar keeps its count in view.
 */
export function readoutShift(end: number, settled: number, trackWidth: number, readoutWidth: number) {
  return Math.min(end, Math.max(settled, trackWidth - readoutWidth)) - settled
}

/** Canvas backing density: the screen's, capped at 2 and by the pixel budget. */
export function backingDensity(width: number, height: number, ratio: number, budget = pixelBudget) {
  if (!(width > 0 && height > 0)) return 1
  return Math.max(1, Math.min(ratio || 1, 2, Math.sqrt(budget / (width * height))))
}

/** Snap a CSS coordinate to the device pixel grid. */
export function snap(value: number, density: number) {
  return Math.round(value * density) / density
}

/** The same color at `alpha` times its own opacity, keeping its color space. */
export function withAlpha(color: string, alpha: number) {
  const round = (value: number) => Math.round(Math.max(0, Math.min(1, value)) * 1000) / 1000
  const parseAlpha = (value: string | undefined) => value === undefined ? 1 : value.endsWith('%') ? parseFloat(value) / 100 : parseFloat(value)
  const legacy = /^rgba?\(([^)]*)\)$/i.exec(color.trim())
  if (legacy) {
    const [red, green, blue, opacity] = legacy[1].trim().split(/\s*,\s*|\s*\/\s*|\s+/)
    return `rgba(${red}, ${green}, ${blue}, ${round(parseAlpha(opacity) * alpha)})`
  }
  const modern = /^([a-z-]+)\(([^/)]*?)(?:\s*\/\s*([^)]+))?\)$/i.exec(color.trim())
  if (modern) return `${modern[1]}(${modern[2].trim()} / ${round(parseAlpha(modern[3]?.trim()) * alpha)})`
  return color
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface BenchmarkBarPaint {
  /** The bar's color mixed into the ground, where the bar leaves the zero edge. */
  start: string
  middle: string
  end: string
}

export interface BenchmarkPaints {
  forced: boolean
  rule: string
  tick: string
  hatch: string
  light: string
  shade: string
  silk: { shadow: string, body: string, fold: string, sheen: string }
  bars: Record<string, BenchmarkBarPaint>
}

export interface BenchmarkSceneRow {
  name: string
  signal: boolean
  /** The track's left edge, vertical centre and width, in CSS pixels on the canvas. */
  x: number
  y: number
  width: number
  percent: number
}

export interface BenchmarkScene {
  width: number
  height: number
  density: number
  barHeight: number
  /** The ruler's top edge; gridlines stop here. */
  baseline: number
  gridAlpha: number
  /** Long ribbons fold at both ends and cast a shadow; a phone's short one keeps only its satin. */
  folds: boolean
  /** Tick positions in percent; while the data changes, the outgoing ruler fades as the next one appears. */
  axes: { ticks: number[], alpha: number }[]
  rows: BenchmarkSceneRow[]
  /** The travelling satin's centre along the ribbon, while it passes during a run. */
  satin?: number
}

/** The bar's box: its square left edge is the shared zero, its length the measured share of the track. */
export function barRect(row: BenchmarkSceneRow, barHeight: number, density: number): Rect {
  const height = Math.max(1, snap(barHeight, density))
  return {
    x: snap(row.x, density),
    y: snap(row.y - barHeight / 2, density),
    width: Math.max(1 / density, row.width * row.percent / 100),
    height
  }
}

/** A path square at the zero edge and softly rounded where the bar ends. */
function barPath(ctx: CanvasRenderingContext2D, { x, y, width, height }: Rect) {
  const radius = Math.min(barRadius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + width - radius, y)
  ctx.arcTo(x + width, y, x + width, y + radius, radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
  ctx.lineTo(x, y + height)
  ctx.closePath()
}

/** The site's diagonal stripe tile (`--stripe-image`), as a pattern in CSS pixels. */
export function createHatch(ctx: CanvasRenderingContext2D, color: string, density: number) {
  const size = 8
  const pixels = Math.max(4, Math.round(size * density))
  const tile = document.createElement('canvas')
  tile.width = tile.height = pixels
  const tileContext = tile.getContext('2d')
  if (!tileContext) return null
  tileContext.strokeStyle = color
  tileContext.lineWidth = 0.5 * density
  tileContext.beginPath()
  for (const offset of [0, pixels, pixels * 2]) {
    tileContext.moveTo(offset - pixels - 1, pixels + 1)
    tileContext.lineTo(offset + 1, -1)
  }
  tileContext.stroke()
  const pattern = ctx.createPattern(tile, 'repeat')
  pattern?.setTransform(new DOMMatrix([1 / density, 0, 0, 1 / density, 0, 0]))
  return pattern
}

/** Paint the whole chart. It is a few dozen fills, so every frame of a run repaints it all. */
export function paintBenchmark(ctx: CanvasRenderingContext2D, scene: BenchmarkScene, paints: BenchmarkPaints, hatch: CanvasPattern | null) {
  const { density } = scene
  ctx.save()
  ctx.setTransform(density, 0, 0, density, 0, 0)
  ctx.clearRect(0, 0, scene.width, scene.height)
  paintGrid(ctx, scene, paints)
  // Under forced colors only the measured bars, gridlines and ruler remain; the hatch would read as noise.
  if (!paints.forced) for (const row of scene.rows) paintTrack(ctx, scene, row, hatch)
  for (const row of scene.rows) {
    const rect = barRect(row, scene.barHeight, density)
    if (row.signal) paintRibbon(ctx, scene, rect, paints)
    else paintBar(ctx, rect, paints.bars[row.name] ?? { start: paints.tick, middle: paints.tick, end: paints.tick }, paints, density)
  }
  paintRuler(ctx, scene, paints)
  ctx.restore()
}

/** Dashed gridlines at the labelled steps, 2px on and 2px off like the drafting rails. */
function paintGrid(ctx: CanvasRenderingContext2D, scene: BenchmarkScene, paints: BenchmarkPaints) {
  const { density } = scene
  const line = Math.max(1, Math.round(density)) / density
  const bottom = snap(scene.baseline, density)
  ctx.fillStyle = paints.rule
  for (const axis of scene.axes) {
    if (axis.alpha <= 0.01) continue
    ctx.globalAlpha = (paints.forced ? 1 : 0.6) * scene.gridAlpha * axis.alpha
    ctx.beginPath()
    for (const percent of axis.ticks) {
      const x = Math.min(snap(scene.width * percent / 100, density), scene.width - line)
      for (let y = 0; y < bottom; y += 4) ctx.rect(x, y, line, Math.min(2, bottom - y))
    }
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/** Each row's full extent is reserved space: the site's hatch, at half strength. */
function paintTrack(ctx: CanvasRenderingContext2D, scene: BenchmarkScene, row: BenchmarkSceneRow, hatch: CanvasPattern | null) {
  if (!hatch) return
  const rect = barRect({ ...row, percent: 100 }, scene.barHeight, scene.density)
  ctx.globalAlpha = 0.5
  ctx.fillStyle = hatch
  barPath(ctx, rect)
  ctx.fill()
  ctx.globalAlpha = 1
}

function paintBar(ctx: CanvasRenderingContext2D, rect: Rect, paint: BenchmarkBarPaint, paints: BenchmarkPaints, density: number) {
  barPath(ctx, rect)
  if (paints.forced) {
    ctx.fillStyle = paint.middle
    ctx.fill()
    return
  }
  const gradient = ctx.createLinearGradient(rect.x, 0, rect.x + rect.width, 0)
  gradient.addColorStop(0, paint.start)
  gradient.addColorStop(0.55, paint.middle)
  gradient.addColorStop(1, paint.end)
  ctx.fillStyle = gradient
  ctx.fill()
  // A lit face: the top edge catches the light and the lower edge settles, as on the page's sheets.
  ctx.save()
  ctx.clip()
  const edge = Math.max(1, Math.round(density)) / density
  ctx.fillStyle = paints.light
  ctx.fillRect(rect.x, rect.y, rect.width, edge)
  ctx.fillStyle = paints.shade
  ctx.fillRect(rect.x, rect.y + rect.height - edge, rect.width, edge)
  ctx.restore()
}

/**
 * The Master CSS bar is a ribbon of the hero's silk: a fold that deepens at both ends, a satin highlight that
 * stretches along it and stays narrow across it, a thin crest where that highlight peaks, and a broad sheen
 * that travels the ribbon's length, like the lamp passing over silk, as the bars land.
 */
function paintRibbon(ctx: CanvasRenderingContext2D, scene: BenchmarkScene, rect: Rect, paints: BenchmarkPaints) {
  const { silk } = paints
  const { density } = scene
  if (paints.forced) {
    barPath(ctx, rect)
    ctx.fillStyle = silk.body
    ctx.fill()
    return
  }
  const { x, y, width, height } = rect
  if (scene.folds && width > 8) {
    // The ribbon rests just above the page: a short shadow drawn in from its edges.
    ctx.save()
    ctx.shadowColor = withAlpha(silk.shadow, 0.8)
    ctx.shadowBlur = 6 * density
    ctx.shadowOffsetY = 2 * density
    ctx.fillStyle = silk.shadow
    barPath(ctx, { x: x + 3, y: y + 3, width: width - 6, height: height - 6 })
    ctx.fill()
    ctx.restore()
  }
  barPath(ctx, rect)
  const body = ctx.createLinearGradient(x, 0, x + width, 0)
  if (scene.folds) {
    // The folds keep their width on a long ribbon instead of stretching with it.
    const fold = Math.min(0.28, 44 / Math.max(1, width))
    body.addColorStop(0, silk.shadow)
    body.addColorStop(fold, silk.body)
    body.addColorStop(0.64, silk.fold)
    body.addColorStop(1 - fold * 0.5, silk.body)
    body.addColorStop(1, silk.shadow)
  } else {
    body.addColorStop(0, silk.body)
    body.addColorStop(0.7, silk.fold)
    body.addColorStop(1, silk.body)
  }
  ctx.fillStyle = body
  ctx.fill()

  ctx.save()
  ctx.clip()
  const clear = withAlpha(silk.sheen, 0)
  const satin = ctx.createLinearGradient(0, y, 0, y + height)
  satin.addColorStop(0.12, clear)
  satin.addColorStop(0.34, withAlpha(silk.sheen, 0.85))
  satin.addColorStop(0.58, clear)
  ctx.fillStyle = satin
  ctx.fillRect(x, y, width, height)
  // The crest: a hairline of light along the satin's peak, fading where the ribbon folds away.
  const crest = ctx.createLinearGradient(x, 0, x + width, 0)
  crest.addColorStop(0, clear)
  crest.addColorStop(Math.min(0.3, 24 / Math.max(1, width)), withAlpha(silk.sheen, 0.9))
  crest.addColorStop(Math.max(0.7, 1 - 24 / Math.max(1, width)), withAlpha(silk.sheen, 0.9))
  crest.addColorStop(1, clear)
  ctx.fillStyle = crest
  ctx.fillRect(x, snap(y + height * 0.3, density), width, Math.max(1, Math.round(density * 0.5)) / density)
  ctx.fillStyle = withAlpha(silk.shadow, 0.7)
  const edge = Math.max(1, Math.round(density)) / density
  ctx.fillRect(x, y + height - edge, width, edge)
  if (scene.satin !== undefined) {
    const center = x + width * scene.satin
    const half = width * 0.42
    const sheen = ctx.createLinearGradient(center - half, 0, center + half, 0)
    sheen.addColorStop(0, clear)
    sheen.addColorStop(0.5, silk.sheen)
    sheen.addColorStop(1, clear)
    ctx.globalCompositeOperation = 'soft-light'
    ctx.globalAlpha = 0.9
    ctx.fillStyle = sheen
    ctx.fillRect(x, y, width, height)
  }
  ctx.restore()
}

/** The axis is a ruler: a baseline, a tick at every quarter step and a longer one at each labelled step. */
function paintRuler(ctx: CanvasRenderingContext2D, scene: BenchmarkScene, paints: BenchmarkPaints) {
  const { density, width } = scene
  const line = Math.max(1, Math.round(density)) / density
  const top = snap(scene.baseline, density)
  ctx.fillStyle = paints.rule
  ctx.fillRect(0, top, width, line)
  for (const axis of scene.axes) {
    if (axis.alpha <= 0.01 || axis.ticks.length < 2) continue
    ctx.globalAlpha = axis.alpha
    const steps = (axis.ticks.length - 1) * minorTicks
    for (const major of [false, true]) {
      ctx.fillStyle = major ? paints.tick : paints.rule
      ctx.beginPath()
      for (let index = 0; index <= steps; index++) {
        if (index % minorTicks === 0 !== major) continue
        const x = Math.min(snap(width * index / steps, density), width - line)
        ctx.rect(x, top, line, major ? 6 : 4)
      }
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
}

export interface BenchmarkCanvasMode {
  id: string
  rows: { name: string, bytes: number, isMasterCSS: boolean }[]
}

export interface BenchmarkCanvas {
  /** Show a mode on an axis: the first call arms the intro, a new mode animates to its data, a new axis snaps. */
  update: (mode: BenchmarkCanvasMode, axis: BenchmarkAxis) => void
  dispose: () => void
}

interface Row {
  name: string
  signal: boolean
  element: HTMLElement
  track: HTMLElement
  readout: HTMLElement
  value: HTMLElement
  /** Layout without the row's own shift: track left, centre and width, and the readout's width. */
  x: number
  y: number
  width: number
  readoutWidth: number
  fromBytes: number
  toBytes: number
  fromPercent: number
  toPercent: number
  fromShift: number
  delay: number
  bytes: number
  percent: number
  shift: number
  /** What the DOM shows, so a frame writes only what changed. */
  text: string
  shown: { shift: number, offset: number }
  settled: boolean
}

/**
 * Mount the painter on a chart whose rows the server rendered at their measured sizes. It arms the intro
 * offscreen, plays it once when the chart comes into view and animates mode changes. Frames run only during
 * those finite runs, on screen and in a visible tab; at rest the chart requests no frames and runs no animation.
 */
export function mountBenchmarkCanvas(chart: HTMLElement, canvas: HTMLCanvasElement): BenchmarkCanvas | undefined {
  let context: CanvasRenderingContext2D | null = null
  try {
    context = canvas.getContext('2d')
  } catch { /* The DOM bars stay. */ }
  if (!context) return
  const ctx = context
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const forced = matchMedia('(forced-colors: active)')
  const scheme = matchMedia('(prefers-color-scheme: dark)')
  const phone = matchMedia('(width < 40rem)')
  const compact = matchMedia('(width < 52rem)')
  const print = matchMedia('print')
  let resolution = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`)
  const rows = new Map<string, Row>()
  let order: Row[] = []
  let mode: BenchmarkCanvasMode | undefined
  let axis: BenchmarkAxis | undefined
  let fadingTicks: number[] | undefined
  /** One run: the intro or a mode change. `span` ends when the last staggered row lands. */
  let timeline: { started: number, duration: number, span: number } | undefined
  let played = false, present = false, near = false, ribbonPresent = false, disposed = false, painted = false
  let width = 0, height = 0, density = 1, baseline = 0, barHeight = 20, inline = true
  let paints: BenchmarkPaints | undefined
  let hatch: CanvasPattern | null = null
  let frame = 0
  let satin: number | undefined
  let ribbon: HTMLElement | undefined
  let themeKey = ''

  const motionAllowed = () => !reduced.matches
  // light-dark() follows the computed color-scheme, which the theme sets through the root's class and style.
  const currentThemeKey = () => `${getComputedStyle(chart).colorScheme}|${document.documentElement.className}|${scheme.matches}|${forced.matches}`

  function rowFor(element: HTMLElement): Row | undefined {
    const name = element.dataset.brand
    const track = element.querySelector<HTMLElement>('.home-bench-track')
    const readout = element.querySelector<HTMLElement>('.home-bench-readout')
    const value = element.querySelector<HTMLElement>('.home-bench-value')
    if (!name || !track || !readout || !value) return
    const row = rows.get(name) ?? {
      name, signal: false, element, track, readout, value,
      x: 0, y: 0, width: 0, readoutWidth: 0,
      fromBytes: 0, toBytes: 0, fromPercent: 0, toPercent: 0, fromShift: 0, delay: 0,
      bytes: 0, percent: 0, shift: 0, text: value.textContent ?? '', shown: { shift: 0, offset: 0 }, settled: true
    }
    Object.assign(row, { element, track, readout, value, signal: element.classList.contains('home-bench-row-signal') })
    rows.set(name, row)
    return row
  }

  function measure() {
    const box = canvas.getBoundingClientRect()
    width = box.width
    height = box.height
    for (const row of order) {
      const track = row.track.getBoundingClientRect()
      row.x = track.left - box.left
      row.y = track.top + track.height / 2 - box.top - row.shown.shift
      row.width = track.width
      row.readoutWidth = row.readout.offsetWidth
    }
    const ruler = chart.querySelector<HTMLElement>('.home-bench-axis')
    baseline = ruler ? ruler.getBoundingClientRect().top - box.top : height
    inline = parseFloat(getComputedStyle(chart).getPropertyValue('--home-bench-brand-width')) > 0
    const nextDensity = backingDensity(width, height, devicePixelRatio)
    if (nextDensity !== density) hatch = null
    density = nextDensity
    const pixelWidth = Math.max(1, Math.round(width * density))
    const pixelHeight = Math.max(1, Math.round(height * density))
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
    }
  }

  function readPaints() {
    themeKey = currentThemeKey()
    // Probes resolve tokens, light-dark() and color-mix() in this chart's context, all in one style pass.
    const probes: HTMLSpanElement[] = []
    const probe = (parent: HTMLElement, color: string) => {
      const span = document.createElement('span')
      span.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;forced-color-adjust:none;width:var(--home-bench-bar);color:${color}`
      parent.append(span)
      probes.push(span)
      return span
    }
    const names = ['rule', 'tick', 'hatch', 'light', 'shade', 'silk-shadow', 'silk-body', 'silk-fold', 'silk-sheen'] as const
    const tokens = names.map((name) => probe(chart, `var(--home-bench-paint-${name})`))
    const brandProbes = order.filter((row) => !row.signal).map((row) => [row.name, [
      probe(row.element, 'color-mix(in oklab, var(--home-bench-color) 64%, var(--home-ground))'),
      probe(row.element, 'var(--home-bench-color)'),
      probe(row.element, 'var(--home-bench-color-end)')
    ]] as const)
    const color = (span: HTMLElement) => getComputedStyle(span).color
    const [rule, tick, hatchColor, light, shade, shadow, body, fold, sheen] = tokens.map(color)
    barHeight = parseFloat(getComputedStyle(tokens[0]).width) || 20
    const bars: Record<string, BenchmarkBarPaint> = {}
    for (const [name, [start, middle, end]] of brandProbes) bars[name] = { start: color(start), middle: color(middle), end: color(end) }
    for (const span of probes) span.remove()
    paints = { forced: forced.matches, rule, tick, hatch: hatchColor, light, shade, silk: { shadow, body, fold, sheen }, bars }
    hatch = null
  }

  function scene(blend: number): BenchmarkScene {
    const ticks = axis?.ticks.map((tick) => tick.percent) ?? []
    return {
      width, height, density, barHeight, baseline,
      gridAlpha: compact.matches ? 0.5 : 1,
      folds: !phone.matches,
      axes: fadingTicks && blend < 1 ? [{ ticks: fadingTicks, alpha: 1 - blend }, { ticks, alpha: blend }] : [{ ticks, alpha: 1 }],
      rows: order.map((row) => ({ name: row.name, signal: row.signal, x: row.x, y: row.y + row.shift, width: row.width, percent: row.percent })),
      satin
    }
  }

  function paint(blend = 1) {
    // Like the palette, the chart paints nothing until it first comes near the viewport; the DOM bars stand in
    // until then, and it is ready a screen ahead, so no frame shows the DOM bars give way.
    if (!paints || !width || !height || !(near || painted)) return
    hatch ??= createHatch(ctx, paints.hatch, density)
    paintBenchmark(ctx, scene(blend), paints, hatch)
    if (!painted) {
      painted = true
      // The DOM bars cover hydration until the canvas holds a complete frame.
      chart.dataset.renderer = 'canvas'
    }
  }

  /** Write a row's count, its slide and its readout's ride along the bar; only what changed. */
  function write(row: Row) {
    const text = formatKilobytes(row.bytes)
    if (text !== row.text) {
      row.value.textContent = text
      row.text = text
    }
    const shift = Math.round(row.shift * 10) / 10
    if (shift !== row.shown.shift) {
      row.element.style.transform = shift ? `translateY(${shift}px)` : ''
      row.shown.shift = shift
    }
    const offset = inline ? Math.round(readoutShift(row.width * row.percent / 100, row.width * row.toPercent / 100, row.width, row.readoutWidth) * 10) / 10 : 0
    if (offset !== row.shown.offset) {
      row.readout.style.transform = offset ? `translateX(${offset}px)` : ''
      row.shown.offset = offset
    }
  }

  function settle(row: Row, settled: boolean) {
    if (row.settled === settled) return
    row.settled = settled
    if (settled) row.element.dataset.settled = ''
    else delete row.element.dataset.settled
  }

  function finish() {
    timeline = undefined
    fadingTicks = undefined
    satin = undefined
    for (const row of order) {
      row.bytes = row.toBytes
      row.percent = row.toPercent
      row.shift = 0
      write(row)
      settle(row, true)
    }
  }

  /** Hold every bar at the shared start, offscreen, until the chart comes into view. */
  function arm() {
    if (!axis) return
    timeline = undefined
    fadingTicks = undefined
    for (const row of order) {
      row.bytes = row.fromBytes = axis.maxBytes * benchmarkMotion.startPercent / 100
      row.percent = row.fromPercent = benchmarkMotion.startPercent
      row.shift = row.fromShift = 0
      write(row)
      settle(row, false)
    }
  }

  function run(duration: number, rowDelay: number) {
    order.forEach((row, index) => { row.delay = index * rowDelay })
    timeline = { started: performance.now(), duration, span: duration + Math.max(0, order.length - 1) * rowDelay }
    schedule()
  }

  function play() {
    if (played || !axis || !mode) return
    played = true
    if (!motionAllowed() || print.matches) {
      finish()
      paint()
      return
    }
    run(introSeconds(order.length) * 1000, benchmarkMotion.rowDelay * 1000)
  }

  /** Move every row to `now`; returns the outgoing ruler's fade. */
  function advance(now: number) {
    if (!timeline) return 1
    const elapsed = now - timeline.started
    let done = true
    for (const row of order) {
      const progress = easedProgress(elapsed, row.delay, timeline.duration)
      row.bytes = lerp(row.fromBytes, row.toBytes, progress)
      row.percent = lerp(row.fromPercent, row.toPercent, progress)
      row.shift = lerp(row.fromShift, 0, progress)
      write(row)
      if (progress < 1) done = false
      else settle(row, true)
    }
    // The satin is drawn only while its ribbon is on screen and colors are the page's own.
    satin = ribbonPresent && !forced.matches ? satinCenter(elapsed, timeline.duration * benchmarkMotion.satinLead, timeline.span) : undefined
    const blend = easedProgress(elapsed, 0, timeline.duration)
    if (done) finish()
    return blend
  }

  function tick(now: number) {
    frame = 0
    if (disposed || !timeline) return
    paint(advance(now))
    schedule()
  }

  function schedule() {
    if (frame || disposed || !timeline || !present || document.hidden) return
    frame = requestAnimationFrame(tick)
  }

  function pause() {
    cancelAnimationFrame(frame)
    frame = 0
  }

  function observeRibbon() {
    const next = order.find((row) => row.signal)?.element
    if (next === ribbon) return
    if (ribbon) ribbonObserver.unobserve(ribbon)
    ribbon = next
    ribbonPresent = false
    if (ribbon) ribbonObserver.observe(ribbon)
  }

  function update(nextMode: BenchmarkCanvasMode, nextAxis: BenchmarkAxis) {
    const previous = new Map(order.map((row) => [row.name, row.y + row.shift]))
    const first = mode === undefined
    const changedMode = !first && mode!.id !== nextMode.id
    const outgoingTicks = axis?.ticks.map((tick) => tick.percent)
    mode = nextMode
    axis = nextAxis
    order = [...chart.querySelectorAll<HTMLElement>('.home-bench-row')].flatMap((element) => rowFor(element) ?? [])
    observeRibbon()
    measure()
    if (first || !paints) readPaints()
    const bytesByName = new Map(nextMode.rows.map((row) => [row.name, row.bytes]))
    for (const row of order) {
      row.toBytes = bytesByName.get(row.name) ?? 0
      row.toPercent = toPercent(row.toBytes, nextAxis.maxBytes)
    }
    if (!played) {
      if (motionAllowed()) arm()
      else finish()
    } else if (changedMode && motionAllowed()) {
      // Each bar slides to its new rank and resizes from where it is now; the outgoing ruler fades.
      for (const row of order) {
        row.fromBytes = row.bytes
        row.fromPercent = row.percent
        row.fromShift = (previous.get(row.name) ?? row.y) - row.y
        row.shift = row.fromShift
        write(row)
        settle(row, false)
      }
      fadingTicks = outgoingTicks
      run(benchmarkMotion.switchSeconds * 1000, benchmarkMotion.switchRowDelay * 1000)
    } else if (timeline) {
      // A resize mid-run retargets the bars; the run carries on.
      for (const row of order) write(row)
    } else finish()
    paint(timeline ? 0 : 1)
  }

  function resize() {
    if (!mode) return
    measure()
    for (const row of order) write(row)
    paint(timeline ? easedProgress(performance.now() - timeline.started, 0, timeline.duration) : 1)
  }

  function theme() {
    if (currentThemeKey() === themeKey) return
    readPaints()
    resize()
  }

  function colors() {
    readPaints()
    resize()
  }

  function motion() {
    if (!reduced.matches) return
    finish()
    paint()
  }

  function visibility() {
    if (document.hidden) pause()
    else schedule()
  }

  function printing(event?: Event) {
    if (event?.type === 'change' && !print.matches) return
    // Print shows the measured sizes, whatever the animation's state.
    played = true
    finish()
    paint()
  }

  function rescale() {
    resolution.removeEventListener('change', rescale)
    resolution = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`)
    resolution.addEventListener('change', rescale)
    resize()
  }

  // Notifications batch while layout settles; the last entry is the current state.
  const intersection = new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1]
    present = entry.isIntersecting
    const root = entry.rootBounds?.height ?? innerHeight
    if (present && (entry.intersectionRatio >= 0.34 || entry.intersectionRect.height >= root * 0.5)) play()
    if (present) schedule()
    else pause()
  }, { threshold: [0, 0.1, 0.2, 0.34, 0.5] })
  const nearObserver = new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1]
    near = entry.isIntersecting
    if (near && !painted) resize()
  }, { rootMargin: '100% 0px' })
  const ribbonObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.target === ribbon) ribbonPresent = entry.isIntersecting
  })
  const resizeObserver = new ResizeObserver(resize)
  const themeObserver = new MutationObserver(theme)
  intersection.observe(chart)
  nearObserver.observe(chart)
  resizeObserver.observe(chart)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] })
  scheme.addEventListener('change', colors)
  forced.addEventListener('change', colors)
  reduced.addEventListener('change', motion)
  phone.addEventListener('change', resize)
  resolution.addEventListener('change', rescale)
  document.addEventListener('visibilitychange', visibility)
  window.addEventListener('beforeprint', printing)
  print.addEventListener('change', printing)
  canvas.addEventListener('contextrestored', resize)
  document.fonts?.ready.then(() => { if (!disposed) resize() })

  return {
    update,
    dispose() {
      disposed = true
      pause()
      intersection.disconnect()
      nearObserver.disconnect()
      ribbonObserver.disconnect()
      resizeObserver.disconnect()
      themeObserver.disconnect()
      scheme.removeEventListener('change', colors)
      forced.removeEventListener('change', colors)
      reduced.removeEventListener('change', motion)
      phone.removeEventListener('change', resize)
      resolution.removeEventListener('change', rescale)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('beforeprint', printing)
      print.removeEventListener('change', printing)
      canvas.removeEventListener('contextrestored', resize)
      // Leave the server's settled rows behind.
      finish()
      canvas.width = canvas.height = 0
      delete chart.dataset.renderer
    }
  }
}
