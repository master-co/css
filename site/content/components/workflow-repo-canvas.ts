import { workflowProjects } from './workflow-content'
import { chip, dot, plate, registration, smooth, text, type Drawing } from './workflow-painter'
import { arrival, route, signal, wire } from './workflow-signal'

/** Two independent project planes resolve the same class through the entry standing beside it. */
export function drawRepository(d: Drawing) {
  const { ctx, width: w, height: h, colors: c, drift } = d
  const compact = w < 340
  const source = { x: w / 2, y: h - 30 }
  const levels = [h * .2, h * .57]
  const entries = levels.map((y, index) => ({ x: w * .23 + drift.x * (2 - index), y: y + 17 + drift.y * (2 - index) }))
  const files = levels.map((y, index) => ({ x: w * .72 + drift.x * (2 - index), y: y - 2 + drift.y * (2 - index) }))
  const entryW = compact ? 77 : 86, fileW = compact ? 103 : 114
  const feeders = entries.map((entry) => route([{ x: source.x, y: source.y - 17 }, { x: w * .13, y: source.y - 25 }, { x: w * .13, y: entry.y + 32 }, { x: entry.x, y: entry.y + 17 }]))
  const locals = entries.map((entry, i) => route([{ x: entry.x + entryW / 2, y: entry.y }, { x: files[i].x - fileW / 2, y: files[i].y + 6 }]))

  registration(d, 2, 13, w - 4, h - 16)
  plate(d, source.x - 69, source.y + 14, 115, 24, 5)
  // Both projects inherit the repository's definitions; neither borrows the other project's resolution.
  for (let i = 1; i >= 0; i--) {
    ctx.globalAlpha = i === d.active ? .8 : .35
    wire(d, feeders[i], c.line, .8, [2, 4])
  }
  ctx.globalAlpha = 1
  signal(d, feeders[d.active], .08, .78)
  for (let i = 1; i >= 0; i--) {
    const y = levels[i]
    const selected = i === d.active
    const entry = entries[i], file = files[i]
    plate(d, 8, y + 59, w - 79, 48, 4.5, selected ? 1 : .8)
    wire(d, locals[i], selected ? c.quiet : c.line, .9)
    if (selected) signal(d, locals[i], .9, .62)
    chip(d, entry.x, entry.y, entryW, 34, true, selected, 7)
    chip(d, file.x, file.y, fileW, 58, false, selected, 8)
    d.anchor(`entry-${i}`, entry.x, entry.y, entryW, 34)
    d.anchor(`project-${i}`, file.x, file.y, fileW, 58)
    text(d, workflowProjects[i].directory, 17, y + 72, compact ? 9 : 10, selected ? c.ink : c.quiet)
    // A pair of small punched marks gives the plane a scale without adding a frame.
    for (const x of [19, w - 52]) {
      ctx.save()
      ctx.globalAlpha = .7
      ctx.beginPath()
      ctx.ellipse(x, y + 49, 2, .9, 0, 0, Math.PI * 2)
      ctx.strokeStyle = c.line
      ctx.lineWidth = .75
      ctx.stroke()
      ctx.restore()
    }
    if (selected) {
      const port = { x: file.x - fileW / 2, y: file.y + 6 }
      ctx.save()
      ctx.globalAlpha = d.reduced || d.previewed ? 1 : smooth((d.time - 1.52) / .16)
      dot(d, port, 1.4, c.signal)
      ctx.restore()
      arrival(d, port, 1.52, 6)
    }
  }
  chip(d, source.x, source.y, 105, 34, true)
  d.anchor('shared', source.x, source.y, 105, 34)
  return 2.05
}
