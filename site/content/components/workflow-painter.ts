import type { Reflection } from './workflow-reflections'

/** Canvas materials shared by the four Workflow drawings; all colors resolve from the home theme. */
export interface Point { x: number, y: number }
export interface Material {
  ink: string
  paper: string
  ground: string
  glass: string
  edge: string
  line: string
  quiet: string
  signal: string
  light: string
  shadow: string
  mono: string
  dark: boolean
  stone: { top: string, mid: string, bottom: string, rim: string, mirror: string }
}
export interface GlassBuffer { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }
export interface Drawing {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  density: number
  colors: Material
  active: number
  /** Seconds of visible, unpaused time since the current choice. */
  time: number
  /** Cadence chosen on the first paint; resizing must not replay an arrival. */
  endAt: number
  reduced: boolean
  /** A reader has already revealed this choice; keep its destination lit until the next choice. */
  previewed: boolean
  drift: Point
  glass: GlassBuffer
  reflections?: (Reflection | undefined)[]
  anchor: (key: string, x: number, y: number, width?: number, height?: number, charge?: number) => void
}

export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))
export const mix = (a: number, b: number, t: number) => a + (b - a) * t
export const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }

/** Rounded corners in screen space, so a shallow plate never has sharp, mechanical tips. */
export function polygon(corners: Point[], radius = 0) {
  const path = new Path2D()
  for (let i = 0; i < corners.length; i++) {
    const previous = corners[(i + corners.length - 1) % corners.length]
    const current = corners[i]
    const next = corners[(i + 1) % corners.length]
    const before = Math.hypot(previous.x - current.x, previous.y - current.y)
    const after = Math.hypot(next.x - current.x, next.y - current.y)
    const r = Math.min(radius, before / 2, after / 2)
    const a = { x: current.x + (previous.x - current.x) * r / before, y: current.y + (previous.y - current.y) * r / before }
    const b = { x: current.x + (next.x - current.x) * r / after, y: current.y + (next.y - current.y) * r / after }
    if (!i) path.moveTo(a.x, a.y)
    else path.lineTo(a.x, a.y)
    path.quadraticCurveTo(current.x, current.y, b.x, b.y)
  }
  path.closePath()
  return path
}

export function roundRect(x: number, y: number, width: number, height: number, radius = 8) {
  const path = new Path2D()
  path.roundRect(x, y, width, height, radius)
  return path
}

export function line(ctx: CanvasRenderingContext2D, points: Point[], color: string, width = 1, dash: number[] = []) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.setLineDash(dash)
  ctx.stroke()
  ctx.restore()
}

/** A quiet pool of contact shadow, independent of the plate's contour. */
export function shadow(d: Drawing, x: number, y: number, width: number, height: number, opacity = 1) {
  const { ctx, colors } = d
  ctx.save()
  // Leave room for the complete fade, including under the compact source at the scene's foot.
  ctx.translate(x, Math.min(y, d.height - height / 2 - 1))
  ctx.scale(width / 2, height / 2)
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
  gradient.addColorStop(0, colors.shadow)
  gradient.addColorStop(1, 'transparent')
  ctx.globalAlpha = opacity
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(0, 0, 1, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** Sample only the existing drawing, before tinting it. The reusable backing store never exceeds
 * the scene's own pixel budget; drawing images avoids a synchronous pixel read on every frame. */
function transmit(d: Drawing, path: Path2D, x: number, y: number, width: number, height: number, shift = 1.25, bevel?: Path2D) {
  const { ctx, colors, density, glass } = d
  const left = Math.max(0, Math.floor(x - 3)), top = Math.max(0, Math.floor(y - 3))
  const right = Math.min(d.width, Math.ceil(x + width + 3)), bottom = Math.min(d.height, Math.ceil(y + height + 3))
  const w = right - left, h = bottom - top
  if (w <= 0 || h <= 0) return
  const sw = Math.min(ctx.canvas.width, Math.ceil(w * density)), sh = Math.min(ctx.canvas.height, Math.ceil(h * density))
  if (glass.canvas.width < sw) glass.canvas.width = sw
  if (glass.canvas.height < sh) glass.canvas.height = sh
  glass.ctx.clearRect(0, 0, sw, sh)
  glass.ctx.drawImage(ctx.canvas, left * density, top * density, w * density, h * density, 0, 0, sw, sh)
  ctx.save()
  ctx.clip(path)
  const strength = ctx.globalAlpha
  ctx.fillStyle = colors.paper
  ctx.fillRect(left, top, w, h)
  ctx.globalAlpha *= colors.dark ? .92 : .9
  ctx.drawImage(glass.canvas, 0, 0, sw, sh, left - .35 + d.drift.x * .25, top + shift, w + .7, h)
  if (bevel) {
    ctx.save()
    ctx.clip(bevel, 'evenodd')
    ctx.globalAlpha = strength
    ctx.fillRect(left, top, w, h)
    ctx.globalAlpha *= colors.dark ? .84 : .86
    // The cut edge bends the same backdrop a little farther; the clear center stays untouched.
    ctx.drawImage(glass.canvas, 0, 0, sw, sh, left - .65 + d.drift.x * .25, top + shift + .9, w + 1.3, h)
    ctx.restore()
  }
  ctx.restore()
}

/** A glass wafer in the section's shared oblique projection, with a rounded rim and a thin edge. */
export function plate(d: Drawing, x: number, y: number, width: number, depth: number, thickness = 4, strength = 1, slant = 1.15) {
  const { ctx, colors } = d
  const skew = depth * slant
  const corners = [{ x, y }, { x: x + width, y }, { x: x + width + skew, y: y - depth }, { x: x + skew, y: y - depth }]
  const top = polygon(corners, 9)
  const inset = 1.8, diagonal = Math.hypot(1, slant)
  const inner = polygon([
    { x: x + inset * (diagonal + slant), y: y - inset },
    { x: x + width - inset * (diagonal - slant), y: y - inset },
    { x: x + width + skew - inset * (diagonal + slant), y: y - depth + inset },
    { x: x + skew + inset * (diagonal - slant), y: y - depth + inset }
  ], 7.2)
  const bevel = new Path2D(top)
  bevel.addPath(inner)
  const lower = polygon(corners.map((p) => ({ x: p.x, y: p.y + thickness })), 9)
  shadow(d, x + width / 2 + skew / 2 + 5, y + 17, width + skew + 24, 38, .3 * strength)
  shadow(d, x + width / 2 + 3, y + thickness + 5, width + 15, 13, .34 * strength)
  ctx.save()
  ctx.globalAlpha = strength
  // Paint the actual side ribbon, rather than an opaque duplicate under the whole top face.
  const ribbon = new Path2D(lower)
  ribbon.addPath(top)
  ctx.save()
  ctx.clip(lower)
  ctx.clip(ribbon, 'evenodd')
  const edge = ctx.createLinearGradient(0, y - 1, 0, y + thickness)
  edge.addColorStop(0, colors.glass)
  edge.addColorStop(.2, colors.glass)
  edge.addColorStop(.58, colors.edge)
  edge.addColorStop(.84, colors.glass)
  edge.addColorStop(1, colors.edge)
  ctx.globalAlpha = strength * (colors.dark ? .55 : .8)
  ctx.fillStyle = edge
  ctx.fill(lower)
  ctx.restore()
  ctx.globalAlpha = strength * .45
  ctx.strokeStyle = colors.line
  ctx.lineWidth = .6
  ctx.save()
  ctx.clip(ribbon, 'evenodd')
  ctx.stroke(lower)
  ctx.restore()
  ctx.globalAlpha = strength
  transmit(d, top, x, y - depth, width + skew, depth, thickness * .28, bevel)
  const face = ctx.createLinearGradient(x, y - depth, x + width * .3, y)
  face.addColorStop(0, colors.glass)
  face.addColorStop(.45, colors.paper)
  face.addColorStop(1, colors.paper)
  ctx.globalAlpha = strength * (colors.dark ? .2 : .16)
  ctx.fillStyle = face
  ctx.fill(top)
  ctx.globalAlpha = strength
  ctx.strokeStyle = colors.line
  ctx.lineWidth = .7
  ctx.stroke(top)
  ctx.save()
  ctx.clip(top)
  // A broad reflected window has a soft shoulder; its small near lip stays separate from the face.
  const sheen = ctx.createLinearGradient(x + d.drift.x * 5, y, x + width + skew * .3, y - depth)
  sheen.addColorStop(0, 'rgb(255 255 255 / 0)')
  sheen.addColorStop(.1, 'rgb(255 255 255 / 0)')
  sheen.addColorStop(.24, colors.light)
  sheen.addColorStop(.34, colors.light)
  sheen.addColorStop(.58, 'rgb(255 255 255 / 0)')
  sheen.addColorStop(1, 'rgb(255 255 255 / 0)')
  ctx.globalAlpha = strength * .35
  ctx.fillStyle = sheen
  ctx.fillRect(x - 1, y - depth - 1, width + skew + 2, depth + 2)
  ctx.save()
  ctx.clip(bevel, 'evenodd')
  const cut = ctx.createLinearGradient(x + skew, y - depth, x + width, y)
  cut.addColorStop(0, colors.light)
  cut.addColorStop(.3, 'rgb(255 255 255 / 0)')
  cut.addColorStop(.68, 'rgb(255 255 255 / 0)')
  cut.addColorStop(1, colors.light)
  ctx.globalAlpha = strength * .34
  ctx.fillStyle = cut
  ctx.fillRect(x - 1, y - depth - 1, width + skew + 2, depth + 2)
  ctx.restore()
  const lip = ctx.createLinearGradient(0, y - 7, 0, y)
  lip.addColorStop(0, 'rgb(255 255 255 / 0)')
  lip.addColorStop(1, colors.light)
  ctx.globalAlpha = strength * .65
  ctx.fillStyle = lip
  ctx.fillRect(x, y - 7, width + skew, 7)
  ctx.restore()
  // The contour carries the silhouette. Light catches only part of it, then feathers away.
  ctx.save()
  ctx.clip(top)
  const rim = ctx.createLinearGradient(x, 0, x + width, 0)
  rim.addColorStop(0, 'rgb(255 255 255 / 0)')
  rim.addColorStop(.08, colors.light)
  rim.addColorStop(.4, colors.light)
  rim.addColorStop(1, 'rgb(255 255 255 / 0)')
  ctx.strokeStyle = rim
  ctx.lineWidth = .85
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x + 6, y - .7)
  ctx.lineTo(x + width - 6, y - .7)
  ctx.stroke()
  ctx.globalAlpha = strength * .45
  ctx.lineWidth = .65
  ctx.beginPath()
  ctx.moveTo(x + skew + 7, y - depth + .7)
  ctx.lineTo(x + width + skew - 7, y - depth + .7)
  ctx.stroke()
  ctx.restore()
  ctx.restore()
  return { corners, top }
}

/** An upright cut-glass rib. Its narrow right face and broad reflection share the wafers' light. */
export function pane(d: Drawing, x: number, y: number, width: number, height: number, rise = 14) {
  const { ctx, colors: c } = d
  const corners = [{ x, y }, { x: x + width, y: y - rise }, { x: x + width, y: y + height - rise }, { x, y: y + height }]
  const face = polygon(corners, 7)
  const inset = 1.4, slope = rise / width, normal = Math.hypot(1, slope)
  const inner = polygon([
    { x: x + inset, y: y + inset * (normal - slope) },
    { x: x + width - inset, y: y - rise + inset * (normal + slope) },
    { x: x + width - inset, y: y + height - rise - inset * (normal - slope) },
    { x: x + inset, y: y + height - inset * (normal + slope) }
  ], 5.6)
  const bevel = new Path2D(face)
  bevel.addPath(inner)
  const back = polygon(corners.map((p) => ({ x: p.x + 2.2, y: p.y + 1.2 })), 7)
  shadow(d, x + width / 2 + 3, y + height + 5, width + 29, 16, .36)
  ctx.save()
  const ribbon = new Path2D(back)
  ribbon.addPath(face)
  ctx.save()
  ctx.clip(back)
  ctx.clip(ribbon, 'evenodd')
  ctx.fillStyle = c.edge
  ctx.globalAlpha = .75
  ctx.fill(back)
  ctx.restore()
  ctx.globalAlpha = .45
  ctx.strokeStyle = c.line
  ctx.lineWidth = .65
  ctx.stroke(back)
  ctx.globalAlpha = 1
  transmit(d, face, x, y - rise, width + 3, height + rise + 2, 1, bevel)
  const tint = ctx.createLinearGradient(x, 0, x + width, 0)
  tint.addColorStop(0, c.glass)
  tint.addColorStop(.34, c.paper)
  tint.addColorStop(1, c.glass)
  ctx.globalAlpha = c.dark ? .18 : .12
  ctx.fillStyle = tint
  ctx.fill(face)
  ctx.globalAlpha = .75
  ctx.stroke(face)
  ctx.clip(face)
  const reflection = ctx.createLinearGradient(x, 0, x + width, 0)
  reflection.addColorStop(0, 'rgb(255 255 255 / 0)')
  reflection.addColorStop(.18, c.light)
  reflection.addColorStop(.32, c.light)
  reflection.addColorStop(.6, 'rgb(255 255 255 / 0)')
  reflection.addColorStop(1, c.light)
  ctx.globalAlpha = c.dark ? .3 : .24
  ctx.fillStyle = reflection
  ctx.fillRect(x, y - rise, width, height + rise)
  const rim = ctx.createLinearGradient(0, y, 0, y + height)
  rim.addColorStop(0, c.light)
  rim.addColorStop(.2, c.light)
  rim.addColorStop(1, 'rgb(255 255 255 / 0)')
  ctx.globalAlpha = .72
  ctx.strokeStyle = rim
  ctx.lineWidth = .75
  ctx.beginPath()
  ctx.moveTo(x + 2, y + height - 6)
  ctx.lineTo(x + 2, y + 5)
  ctx.lineTo(x + width - 4, y - rise + 3)
  ctx.stroke()
  ctx.restore()
}

/** A readable, front-facing chip. Its inner top light belongs to the same material as the wafers. */
export function chip(d: Drawing, x: number, y: number, width: number, height: number, ink = false, selected = false, radius = 8) {
  const { ctx, colors } = d
  const path = roundRect(x - width / 2, y - height / 2, width, height, radius)
  ctx.save()
  ctx.shadowColor = colors.shadow
  ctx.shadowBlur = (selected ? 13 : 8) * d.density
  ctx.shadowOffsetY = (selected ? 5 : 3) * d.density
  ctx.fillStyle = colors.edge
  ctx.fill(roundRect(x - width / 2, y - height / 2 + 1.8, width, height, radius))
  ctx.restore()
  ctx.save()
  if (ink) {
    stone(d, x, y, width, height, path)
    ctx.restore()
    return
  }
  ctx.fillStyle = colors.paper
  ctx.fill(path)
  ctx.clip(path)
  const face = ctx.createLinearGradient(x - width / 2, y - height / 2, x + width / 3, y + height / 2)
  face.addColorStop(0, colors.light)
  face.addColorStop(.48, colors.paper)
  face.addColorStop(1, colors.glass)
  ctx.globalAlpha = colors.dark ? .2 : .35
  ctx.fillStyle = face
  ctx.fill(path)
  ctx.restore()
  ctx.save()
  ctx.strokeStyle = selected ? colors.quiet : colors.line
  ctx.globalAlpha = selected ? .72 : 1
  ctx.lineWidth = .7
  ctx.stroke(path)
  ctx.clip(path)
  ctx.globalAlpha = 1
  line(ctx, [{ x: x - width / 2 + radius, y: y - height / 2 + .75 }, { x: x + width / 2 - radius, y: y - height / 2 + .75 }], colors.light, .85)
  ctx.restore()
}

/**
 * Polished stone, as on the hero's Get started: a face that darkens toward its base, the softbox's sheen
 * across the upper left, a rim lit on the near side and warm on the far side, and a warm lower mirror.
 */
function stone(d: Drawing, x: number, y: number, width: number, height: number, path: Path2D) {
  const { ctx, colors: { stone, dark } } = d
  const left = x - width / 2, top = y - height / 2
  const face = ctx.createLinearGradient(0, top, 0, top + height)
  face.addColorStop(0, stone.top)
  face.addColorStop(.52, stone.mid)
  face.addColorStop(1, stone.bottom)
  ctx.fillStyle = face
  ctx.fill(path)
  ctx.clip(path)
  const sheen = ctx.createRadialGradient(left + width * .3, top - height * .2, 0, left + width * .3, top - height * .2, Math.max(width * .75, height))
  sheen.addColorStop(0, dark ? 'rgb(255 255 255 / .85)' : 'rgb(255 255 255 / .16)')
  sheen.addColorStop(1, 'rgb(255 255 255 / 0)')
  ctx.fillStyle = sheen
  ctx.fill(path)
  const mirror = ctx.createLinearGradient(0, top + height * .7, 0, top + height)
  mirror.addColorStop(0, 'rgb(0 0 0 / 0)')
  mirror.addColorStop(1, stone.mirror)
  ctx.fillStyle = mirror
  ctx.globalAlpha = dark ? .6 : 1
  ctx.fill(path)
  ctx.globalAlpha = 1
  const rim = ctx.createLinearGradient(left, top, left + width * .7, top + height * 1.3)
  rim.addColorStop(0, stone.rim)
  rim.addColorStop(.42, 'rgb(255 255 255 / 0)')
  rim.addColorStop(.6, 'rgb(255 255 255 / 0)')
  rim.addColorStop(1, stone.mirror)
  ctx.strokeStyle = rim
  ctx.lineWidth = 2
  ctx.stroke(path)
}

export function text(d: Drawing, label: string, x: number, y: number, size = 10, color = d.colors.quiet, align: CanvasTextAlign = 'left') {
  d.ctx.save()
  d.ctx.font = `${size}px ${d.colors.mono}`
  d.ctx.fillStyle = color
  d.ctx.textAlign = align
  d.ctx.textBaseline = 'middle'
  d.ctx.fillText(label, x, y)
  d.ctx.restore()
}

export function dot(d: Drawing, point: Point, radius: number, color: string) {
  d.ctx.beginPath()
  d.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
  d.ctx.fillStyle = color
  d.ctx.fill()
}

/** A socket has a recessed neutral rim; only its near edge belongs to the live signal. */
export function socket(d: Drawing, point: Point, active: boolean, charge = 1, radius = 15, depth = 4.5) {
  const { ctx, colors: c } = d
  ctx.save()
  const lens = ctx.createLinearGradient(0, point.y - depth, 0, point.y + depth)
  lens.addColorStop(0, c.edge)
  lens.addColorStop(.48, c.paper)
  lens.addColorStop(1, c.glass)
  ctx.globalAlpha = .36 + (active ? .34 * charge : 0)
  ctx.beginPath()
  ctx.ellipse(point.x, point.y, radius, depth, 0, 0, Math.PI * 2)
  ctx.fillStyle = lens
  ctx.fill()
  ctx.strokeStyle = c.line
  ctx.lineWidth = .7
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(point.x, point.y - .5, radius - .8, depth - .5, 0, Math.PI, Math.PI * 2)
  ctx.strokeStyle = c.light
  ctx.stroke()
  if (active) {
    ctx.globalAlpha = .9 * charge
    ctx.beginPath()
    ctx.ellipse(point.x, point.y, radius, depth, 0, .12, Math.PI - .12)
    ctx.strokeStyle = c.signal
    ctx.lineWidth = 1
    ctx.stroke()
  }
  ctx.restore()
}

/** Small registration marks locate an open drawing without enclosing it in another frame. */
export function registration(d: Drawing, x: number, y: number, width: number, height: number) {
  const arm = 7
  const { ctx, colors } = d
  ctx.save()
  ctx.globalAlpha = .65
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + width, y, -1, 1], [x, y + height, 1, -1], [x + width, y + height, -1, -1]]) {
    line(ctx, [{ x: cx, y: cy + sy * arm }, { x: cx, y: cy }, { x: cx + sx * arm, y: cy }], colors.line, .8)
  }
  ctx.restore()
}
