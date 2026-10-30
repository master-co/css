import { clamp, dot, mix, smooth, type Drawing, type Point } from './workflow-painter'

export interface Track {
  path: Path2D
  points: Point[]
  distances: number[]
  length: number
}

function measured(path: Path2D, points: Point[]): Track {
  const distances = [0]
  for (let i = 1; i < points.length; i++) distances.push(distances[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y))
  return { path, points, distances, length: distances[distances.length - 1] }
}

/** The etched wire and its pulse use the same rounded path and measured screen-space distance. */
export function route(points: Point[], radius = 7): Track {
  const clean = points.filter((p, i) => !i || Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y) > .01)
  const path = new Path2D()
  const samples = [clean[0]]
  path.moveTo(clean[0].x, clean[0].y)
  for (let i = 1; i < clean.length - 1; i++) {
    const previous = clean[i - 1], p = clean[i], next = clean[i + 1]
    const before = Math.hypot(previous.x - p.x, previous.y - p.y), after = Math.hypot(next.x - p.x, next.y - p.y)
    const r = Math.min(radius, before * .4, after * .4)
    const a = { x: p.x + (previous.x - p.x) * r / before, y: p.y + (previous.y - p.y) * r / before }
    const b = { x: p.x + (next.x - p.x) * r / after, y: p.y + (next.y - p.y) * r / after }
    path.lineTo(a.x, a.y)
    samples.push(a)
    path.quadraticCurveTo(p.x, p.y, b.x, b.y)
    for (let step = 1; step <= 8; step++) {
      const t = step / 8, s = 1 - t
      samples.push({ x: s * s * a.x + 2 * s * t * p.x + t * t * b.x, y: s * s * a.y + 2 * s * t * p.y + t * t * b.y })
    }
  }
  const end = clean[clean.length - 1]
  path.lineTo(end.x, end.y)
  samples.push(end)
  return measured(path, samples)
}

/** Cubic graph branches keep their tangency while the light travels at a stable visual speed. */
export function branch(a: Point, b: Point, vertical: boolean): Track {
  const middle = vertical ? (a.y + b.y) / 2 : (a.x + b.x) / 2
  const c = vertical ? { x: a.x, y: middle } : { x: middle, y: a.y }
  const d = vertical ? { x: b.x, y: middle } : { x: middle, y: b.y }
  const path = new Path2D()
  path.moveTo(a.x, a.y)
  path.bezierCurveTo(c.x, c.y, d.x, d.y, b.x, b.y)
  const points = Array.from({ length: 49 }, (_, i) => {
    const t = i / 48, s = 1 - t
    return { x: s ** 3 * a.x + 3 * s * s * t * c.x + 3 * s * t * t * d.x + t ** 3 * b.x, y: s ** 3 * a.y + 3 * s * s * t * c.y + 3 * s * t * t * d.y + t ** 3 * b.y }
  })
  return measured(path, points)
}

export function wire(d: Drawing, track: Track, color = d.colors.line, width = .8, dash: number[] = []) {
  d.ctx.save()
  d.ctx.strokeStyle = color
  d.ctx.lineWidth = width
  d.ctx.lineCap = 'round'
  d.ctx.setLineDash(dash)
  d.ctx.stroke(track.path)
  d.ctx.restore()
}

function along(track: Track, distance: number) {
  const target = clamp(distance, 0, track.length)
  let low = 1, high = track.points.length - 1
  while (low < high) {
    const middle = (low + high) >> 1
    if (track.distances[middle] < target) low = middle + 1
    else high = middle
  }
  const a = track.points[low - 1], b = track.points[low]
  const t = (target - track.distances[low - 1]) / Math.max(.001, track.distances[low] - track.distances[low - 1])
  return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) }
}

/** A restrained head and a tapered wake, with a brief acceleration and a quiet landing. */
export function signal(d: Drawing, track: Track, phase = 0, duration = .8) {
  if (d.reduced || track.length < .1) return
  const age = d.time - phase
  if (age <= 0 || age >= duration + .18) return
  const acceleration = Math.min(.12, .09 / duration), braking = Math.min(.14, .1 / duration)
  const cruise = 1 - (acceleration + braking) / 2
  // Integrate a smooth velocity shoulder at each end, with a steady middle. Sampling earlier
  // positions makes the wake stretch in flight and gather into the socket as the head stops.
  const travel = (seconds: number) => {
    const t = clamp(seconds / duration)
    if (t < acceleration) {
      const p = t / acceleration
      return acceleration * (p ** 3 - p ** 4 / 2) / cruise
    }
    if (t > 1 - braking) {
      const p = (1 - t) / braking
      return 1 - braking * (p ** 3 - p ** 4 / 2) / cruise
    }
    return (t - acceleration / 2) / cruise
  }
  const distance = travel(age) * track.length
  const tail = Math.min(24, track.length * .28)
  const history = Math.min(.16, tail * duration * cruise / track.length)
  const launch = smooth(age / .09)
  const { ctx, colors: c } = d
  ctx.save()
  ctx.lineCap = 'round'
  const steps = Math.ceil(tail / 1.1)
  for (let i = steps; i > 0; i--) {
    const start = travel(age - i / steps * history) * track.length
    const end = travel(age - (i - 1) / steps * history) * track.length
    if (end - start < .01) continue
    const point = along(track, start)
    const next = along(track, end)
    const weight = 1 - i / (steps + 1)
    ctx.globalAlpha = launch * weight ** 1.6 * .65
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
    ctx.lineTo(next.x, next.y)
    ctx.lineWidth = .5 + weight * .8
    ctx.strokeStyle = c.signal
    ctx.stroke()
  }
  const head = along(track, distance)
  const opacity = launch * (1 - smooth(Math.max(0, age - duration) / .14))
  ctx.globalAlpha = opacity * .12
  const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 4)
  glow.addColorStop(0, c.signal)
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(head.x - 4, head.y - 4, 8, 8)
  ctx.globalAlpha = opacity
  dot(d, head, 1.3, c.signal)
  ctx.globalAlpha *= .6
  dot(d, { x: head.x - .2, y: head.y - .25 }, .45, 'white')
  ctx.restore()
}

/** The arriving light briefly spreads across its socket; it never keeps a render loop alive. */
export function arrival(d: Drawing, point: Point, phase: number, spread = 7, depth = 1) {
  if (d.reduced) return
  const progress = (d.time - phase) / .44
  if (progress <= 0 || progress >= 1) return
  const radius = mix(1.4, spread, 1 - (1 - progress) ** 3)
  const { ctx, colors: c } = d
  ctx.save()
  ctx.globalAlpha = smooth(progress / .12) * (1 - progress) ** 1.7 * .36
  ctx.beginPath()
  ctx.ellipse(point.x, point.y, radius, radius * depth, 0, 0, Math.PI * 2)
  ctx.strokeStyle = c.signal
  ctx.lineWidth = .8
  ctx.stroke()
  ctx.globalAlpha *= .3
  ctx.fillStyle = c.signal
  ctx.fill()
  ctx.restore()
}
