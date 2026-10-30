import { workflowTraceEdges, workflowTraceNodes } from './workflow-content'
import { chip, clamp, pane, plate, registration, text, type Drawing } from './workflow-painter'
import { arrival, branch, route, signal, wire, type Track } from './workflow-signal'

/** Ancestors and descendants, independently: a class does not select its unrelated sibling. */
export function traceNodes(node: number) {
  const walk = (reverse: boolean) => {
    const found = new Set([node])
    for (const current of found) {
      for (const [from, to] of workflowTraceEdges) {
        if ((reverse ? to : from) === current) found.add(reverse ? from : to)
      }
    }
    return found
  }
  return new Set([...walk(false), ...walk(true)])
}

/** Glass reading lanes keep the dependency chain legible while a single change crosses the graph. */
export function drawTrace(d: Drawing) {
  const { ctx, width: w, height: h, colors: c, drift } = d
  const vertical = w < 490
  const nodes = workflowTraceNodes.map(([column, , kind, row, across], index) => {
    const width = kind === 'definition' ? 118 : kind === 'class' ? 84 : kind === 'output' ? 72 : 98
    const acrossX = [Math.max(76, w * .13), w * .39, w * .66, Math.min(w - 54, w * .91)][column]
    const x = vertical ? (index === 3 ? .2 : index === 4 ? .5 : index === 5 ? .8 : across / 100) * w : acrossX + drift.x * column * .6
    return {
      // Keep the full shadow inside the drawing, including the two outer file nodes on phones.
      x: vertical && kind === 'file' ? clamp(x, 62, w - 62) : x,
      y: vertical ? [ .15, .38, .65, .9 ][column] * h + (index === 4 ? 44 : 0) : 29 + row / 100 * (h - 65) + drift.y * column * .4,
      width: vertical && kind === 'file' ? 94 : width,
      height: kind === 'definition' ? 54 : 33
    }
  })
  const selected = traceNodes(d.active)
  registration(d, 2, 13, w - 4, h - 16)

  for (let column = 0; column < 4; column++) {
    if (vertical) {
      const y = [.15, .38, .65, .9][column] * h
      // The files occupy two rows, so their shared shelf grows in depth. A compact, centered
      // output shelf leaves the opaque play control clear of the glass contour.
      const depth = column === 2 ? 68 : 16
      const shelfWidth = column === 3 ? Math.min(160, w - 100) : w - 28 - (depth - 16) * .2
      const shelfX = column === 3 ? (w - shelfWidth - depth * .2) / 2 : 8
      plate(d, shelfX, y + (column === 2 ? 66 : 29), shelfWidth, depth, 2.2, .6, .2)
      text(d, `0${column + 1}`, 9, y - (column === 0 ? 38 : 28), 9)
    } else {
      const x = nodes.find((_, index) => workflowTraceNodes[index][0] === column)!.x
      pane(d, x - 24, 30, 38, h - 59, 14)
      text(d, `0${column + 1}`, x - 4, h - 12, 9, c.quiet, 'center')
    }
  }

  for (const [from, to] of workflowTraceEdges) {
    const first = nodes[from], second = nodes[to]
    const a = vertical ? { x: first.x, y: first.y + first.height / 2 } : { x: first.x + first.width / 2, y: first.y }
    const b = vertical ? { x: second.x, y: second.y - second.height / 2 } : { x: second.x - second.width / 2, y: second.y }
    const lit = selected.has(from) && selected.has(to)
    ctx.save()
    ctx.globalAlpha = lit ? .75 : .18
    let track: Track
    // Badge sits between the outer files on phones. Its inputs converge above them; their
    // outputs converge below it, so a dependency never appears to pass through another file.
    if (vertical && to === 4) {
      const entryY = nodes[3].y - nodes[3].height / 2 - 24
      track = route([a, { x: a.x, y: entryY }, { x: b.x, y: entryY }, b], 14)
    } else if (vertical && to === 6 && from !== 4) {
      const exitY = nodes[4].y + nodes[4].height / 2 + 16
      track = route([a, { x: a.x, y: exitY }, { x: b.x, y: b.y - 6 }, b], 12)
    } else track = branch(a, b, vertical)
    wire(d, track, lit ? c.quiet : c.line, .9)
    ctx.restore()
    if (lit) {
      const phase = .08 + workflowTraceNodes[from][0] * .7
      signal(d, track, phase, .65)
      arrival(d, b, phase + .65, 5)
    }
  }
  nodes.forEach((node, index) => {
    chip(d, node.x, node.y, node.width, node.height, index === 0, index === d.active, index === 0 ? 9 : 7)
    d.anchor(`node-${index}`, node.x, node.y, node.width, node.height)
  })
  return 2.65
}
