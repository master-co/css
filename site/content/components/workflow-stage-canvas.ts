import { workflowFrameworks, workflowIntegrations } from './workflow-content'
import { chip, clamp, dot, mix, plate, registration, shadow, smooth, socket, text, type Drawing, type Point } from './workflow-painter'
import { arrival, route, signal, wire } from './workflow-signal'

const timing = { source: .06, integration: .61, riser: .68, surface: 1.41, etching: 1.43 }

/** Every layout keeps all sixteen guides. Narrow scenes fold the two logo rows into four. */
export function drawFrameworks(d: Drawing) {
  const { ctx, width: w, height: h, colors: c, drift } = d
  const narrow = w < 480
  const columns = narrow ? 4 : 8
  const rows = Math.ceil(workflowFrameworks.length / columns)
  const side = narrow ? 4 : 32
  const top = narrow ? 40 : 48
  const rowGap = narrow ? 50 : 54
  // Next.js paints at 39px after its shared brand scale. Reserve its radius plus 2px.
  const clearance = 21.5
  const slant = narrow ? .2 : 1.15
  const rowShift = rowGap * slant
  const usable = w - side * 2 - (rows - 1) * rowShift
  const cell = usable / columns
  const foot = top + (rows - 1) * rowGap + 28
  const frameworkPoints = workflowFrameworks.map((_, index) => ({
    x: side + cell * (index % columns + .5) + (rows - 1 - Math.floor(index / columns)) * rowShift + drift.x * 3,
    y: top + Math.floor(index / columns) * rowGap + drift.y * 2
  }))
  const integrationY = narrow ? h * .68 : h * .64
  const integrationColumns = narrow ? 4 : 7
  const integrationCell = (w - (narrow ? 24 : 50)) / integrationColumns
  const integrationPoints = workflowIntegrations.map((_, index) => ({
    x: (narrow ? 12 : 25) + integrationCell * (index % integrationColumns + .5) + (narrow && index >= 4 ? integrationCell / 2 : 0) + drift.x * 1.4,
    y: integrationY + Math.floor(index / integrationColumns) * 37 + drift.y
  }))
  const source: Point = { x: w * .5 + drift.x * .5, y: h - 36 + drift.y * .5 }
  const activeIntegration = workflowIntegrations.findIndex((item) => item.key === workflowFrameworks[d.active].integration)
  const activePoint = frameworkPoints[d.active]
  // The target catches the light on contact. Reading or choosing a guide shows its settled state.
  const settled = d.reduced || d.previewed
  const integrationCharge = settled ? 1 : smooth((d.time - timing.integration) / .16)
  const etchings = frameworkPoints.map((point, index) => {
    const row = Math.floor(index / columns), column = index % columns
    const side = column === columns - 1 ? -1 : 1
    const bias = (row - (rows - 1) / 2) * .6 + (side < 0 ? 1.2 : -1.2)
    const lane = side * clamp(cell / 2 + side * bias, clearance, cell - clearance)
    const bottom = frameworkPoints[(rows - 1) * columns + column]
    const points: Point[] = [{ x: bottom.x + lane, y: foot + 12 }]
    // Run through the open gutters, turning between rows. A pulse never reads as a visit to
    // an unrelated brand floating over the glass, even now that the surface is clearer.
    for (let lower = rows - 1; lower > row; lower--) {
      const current = frameworkPoints[lower * columns + column]
      const above = frameworkPoints[(lower - 1) * columns + column]
      points.push({ x: current.x + lane, y: current.y - clearance }, { x: above.x + lane, y: current.y - clearance })
    }
    const approachY = point.y + (row < rows - 1 ? rowGap - clearance : 32)
    points.push({ x: point.x + lane, y: approachY }, { x: point.x, y: approachY }, { x: point.x, y: point.y + 22 })
    return route(points, 2.5)
  })
  const receivedAt = d.endAt ? d.endAt - .52 : timing.etching + clamp(etchings[d.active].length / 240, .28, 1.05)
  const surfaceFlight = receivedAt - timing.etching
  const frameworkCharge = settled ? 1 : smooth((d.time - receivedAt) / .2)
  const arrivals = etchings.map((track) => track.points[0])
  const feeders = integrationPoints.map((p) => route([{ x: source.x, y: source.y - 21 }, { x: source.x, y: source.y - 27 }, { x: p.x, y: p.y + 25 }, { x: p.x, y: p.y + 18 }]))
  const risers = frameworkPoints.map((_, i) => {
    const target = workflowIntegrations.findIndex((item) => item.key === workflowFrameworks[i].integration)
    const origin = integrationPoints[target], port = arrivals[i]
    return route([{ x: origin.x, y: origin.y - 13.5 }, { x: origin.x, y: origin.y - 23 }, { x: port.x, y: port.y + 7 }, port])
  })

  // The floor is a compact source; the two upper planes grow with the number of consumers.
  plate(d, source.x - 64, source.y + 16, 124, 24, 5, 1, slant)
  for (let i = 0; i < integrationPoints.length; i++) {
    ctx.globalAlpha = i === activeIntegration ? .65 : .25
    wire(d, feeders[i], i === activeIntegration ? c.quiet : c.line)
  }
  ctx.globalAlpha = 1
  signal(d, feeders[activeIntegration], timing.source, timing.integration - timing.source)
  const integrationDepth = narrow ? 61 : 26
  const integrationFront = integrationY + (narrow ? 54 : 18)
  plate(d, narrow ? 9 : 17, integrationFront, w - (narrow ? 31 : 67), integrationDepth, 4, 1, slant)

  // Vertical risers pass behind the upper glass, then terminate in a small socket under each logo.
  for (let i = 0; i < frameworkPoints.length; i++) {
    ctx.globalAlpha = i === d.active ? .7 : .24
    wire(d, risers[i], i === d.active ? c.quiet : c.line)
  }
  ctx.globalAlpha = 1
  signal(d, risers[d.active], timing.riser, timing.surface - timing.riser)
  const frameworkDepth = (rows - 1) * rowGap + 43
  const surface = plate(d, 10, foot + 12, w - (narrow ? 54 : 134), frameworkDepth, 4.5, 1, slant)
  ctx.save()
  ctx.clip(surface.top)
  d.reflections?.forEach((reflection, index) => {
    if (!reflection) return
    const p = frameworkPoints[index], size = reflection.width
    const depth = .28, height = size * depth
    ctx.save()
    const lift = index === d.active ? frameworkCharge : 0
    ctx.globalAlpha = .035 + .09 * lift
    ctx.translate(p.x - size / 2 - height * slant, p.y + 23 + height + lift * 1.4)
    ctx.transform(1, 0, slant * depth, -depth, 0, 0)
    ctx.drawImage(c.dark ? reflection.dark : reflection.light, 0, 0, size, size)
    ctx.restore()
  })
  ctx.restore()

  for (let i = 0; i < frameworkPoints.length; i++) {
    const p = frameworkPoints[i]
    const active = i === d.active
    ctx.save()
    ctx.globalAlpha = active ? .45 : .18
    wire(d, etchings[i], active ? c.quiet : c.line, .7)
    ctx.restore()
    const lift = active ? frameworkCharge : 0
    shadow(d, p.x, p.y + 22, mix(34, 39, lift), mix(9, 12, lift), mix(.58, .34, lift))
    socket(d, { x: p.x, y: p.y + 22 }, active, frameworkCharge)
    d.anchor(`framework-${i}`, p.x, p.y - (active ? 3 * frameworkCharge : 0), Math.min(44, cell), 44, active ? frameworkCharge : 0)
  }
  signal(d, etchings[d.active], timing.etching, surfaceFlight)
  arrival(d, { x: activePoint.x, y: activePoint.y + 22 }, receivedAt, 19, .3)
  for (let i = 0; i < integrationPoints.length; i++) {
    const p = integrationPoints[i]
    const active = i === activeIntegration
    const chipW = Math.min(integrationCell - 8, workflowIntegrations[i].key === 'webpack' ? 66 : 54)
    chip(d, p.x, p.y, chipW, 27, false, active, 6)
    d.anchor(`integration-${i}`, p.x, p.y, chipW, 27)
    if (active) {
      const port = { x: p.x, y: p.y + 18 }
      ctx.save()
      ctx.globalAlpha = integrationCharge
      dot(d, port, 1.4, c.signal)
      ctx.restore()
      arrival(d, port, timing.integration, 6, .5)
    }
  }
  chip(d, source.x, source.y, 111, 42, true, false, 9)
  d.anchor('manifest', source.x, source.y, 111, 42)
  registration(d, 2, 13, w - 4, h - 16)
  if (!narrow) {
    text(d, '01', 8, 30, 9)
    text(d, '02', 8, integrationY - 32, 9)
    text(d, '03', 8, h - 32, 9)
  }
  return receivedAt + .52
}
