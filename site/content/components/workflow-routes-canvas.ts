import { workflowRouteDefinitions, workflowRouteReferences, workflowRoutes } from './workflow-content'
import { chip, dot, line, plate, registration, shadow, text, type Drawing } from './workflow-painter'
import { arrival, route, signal, wire } from './workflow-signal'

/** One route sheet rises from a shared source; its references remain readable native text. */
export function drawRoutes(d: Drawing) {
  const { ctx, width: w, height: h, colors: c, drift } = d
  const narrow = w < 340
  const sheetW = w - (narrow ? 32 : 43)
  const sheetH = 218
  const sheetX = w / 2 - (narrow ? 0 : 8) + drift.x * 2
  const sheetY = 144 + drift.y * 2
  const floorY = h - 39
  const references = workflowRouteReferences(workflowRoutes[d.active].code)
  const definitionPoints = workflowRouteDefinitions.map((_, index) => ({
    x: narrow ? w * .5 + (index % 2 === 0 ? -49 : 49) : 22 + (w - 44) / 4 * (index + .5),
    y: floorY - (narrow ? 52 - Math.floor(index / 2) * 28 : 32)
  }))
  const targets = definitionPoints.map((_, i) => ({ x: sheetX - sheetW / 2 + 34 + i * (sheetW - 68) / 3, y: sheetY + sheetH / 2 }))
  const feeds = definitionPoints.map((p, i) => {
    const port = { x: p.x, y: p.y - 11 }, target = targets[i]
    if (narrow && i > 1) {
      // The lower row rises through the open center gutter, never through the labels above it.
      const channel = w / 2 + (i % 2 ? 5 : -5)
      return route([port, { x: channel, y: port.y }, { x: channel, y: target.y + 5 }, target], 4)
    }
    const middle = (port.y + target.y) / 2
    return route([port, { x: port.x, y: middle }, { x: target.x, y: middle }, target], 4)
  })
  registration(d, 2, 13, w - 4, h - 16)
  plate(d, 7, floorY + 13, w - (narrow ? 31 : 83), narrow ? 81 : 64, 5, 1, narrow ? .2 : 1.15)
  text(d, 'index.css', 20, floorY + 25, 10)

  for (let i = 0; i < definitionPoints.length; i++) {
    const selected = references.includes(workflowRouteDefinitions[i].name)
    ctx.save()
    ctx.globalAlpha = selected ? .8 : .18
    wire(d, feeds[i], selected ? c.quiet : c.line, .8, selected ? [] : [2, 4])
    ctx.restore()
    if (selected) signal(d, feeds[i], .1 + i * .12, .72)
  }
  shadow(d, sheetX + 7, sheetY + sheetH / 2 + 27, sheetW, 44, .8)
  // Two unprinted leaves recede behind the active sheet. Their edge light stays quiet on both themes.
  for (let i = 2; i >= 0; i--) {
    const x = sheetX + i * (narrow ? 3 : 8)
    const y = sheetY - i * 10
    chip(d, x, y, sheetW - i * 4, sheetH, false, i === 0, 10)
    if (i > 0) {
      ctx.save()
      ctx.globalAlpha = .3
      line(ctx, [{ x: x - sheetW / 2 + 15, y: y - sheetH / 2 + 9 }, { x: x + sheetW / 2 - 19, y: y - sheetH / 2 + 9 }], c.light, 1)
      ctx.restore()
    }
  }
  d.anchor('route-sheet', sheetX, sheetY, sheetW, sheetH)
  for (let i = 0; i < definitionPoints.length; i++) {
    const p = definitionPoints[i]
    const selected = references.includes(workflowRouteDefinitions[i].name)
    d.anchor(`definition-${i}`, p.x, p.y, narrow ? 106 : undefined, 22)
    if (selected) {
      dot(d, { x: p.x, y: p.y - 11 }, 1.3, c.signal)
      arrival(d, targets[i], .82 + i * .12, 5, .4)
    }
  }
  return 1.7
}
