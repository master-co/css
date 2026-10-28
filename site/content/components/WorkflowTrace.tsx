import type { CSSProperties } from 'react'
import clsx from 'clsx'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { workflowTraceChange, workflowTraceEdges, workflowTraceNodes } from './workflow-content'

type Orientation = 'wide' | 'narrow'

// Wide cards: columns sit far enough in for their widest node. Narrow cards: one tier per column.
const columnX = [17, 40, 63, 86]
const tierY = [9, 34, 61, 91]
// Badge.tsx drops below its neighbours on narrow cards, so three files fit across.
const narrowLift: Record<number, number> = { 4: 11 }

/** A node's trace: itself, everything it depends on and everything that depends on it. */
function traceOf(node: number) {
  const walk = (start: number, next: (edge: readonly [number, number]) => number | undefined) => {
    const seen = new Set([start])
    for (const index of seen) {
      for (const edge of workflowTraceEdges) {
        const found = edge[0] === index || edge[1] === index ? next(edge) : undefined
        if (found !== undefined && found !== index) seen.add(found)
      }
    }
    return seen
  }
  return new Set([...walk(node, (edge) => edge[1]), ...walk(node, (edge) => edge[0])])
}

const nodeIndexes = workflowTraceNodes.map((_, index) => index)

/** For each node and edge, the nodes whose trace includes it, as a `data-trace` word list. */
export const workflowTraceNodeLists = nodeIndexes.map((node) => nodeIndexes.filter((other) => traceOf(other).has(node)).join(' '))
export const workflowTraceEdgeLists = workflowTraceEdges.map(([from, to]) => nodeIndexes.filter((other) => {
  const trace = traceOf(other)
  return trace.has(from) && trace.has(to)
}).join(' '))

function point(index: number, orientation: Orientation) {
  const [column, , , row, across] = workflowTraceNodes[index]
  return orientation === 'wide' ? { x: columnX[column], y: row } : { x: across, y: tierY[column] + (narrowLift[index] ?? 0) }
}

/** An edge eases out of one column and into the next, across or down depending on the card. */
function edgePath(from: number, to: number, orientation: Orientation) {
  const a = point(from, orientation)
  const b = point(to, orientation)
  if (orientation === 'wide') {
    const middle = (a.x + b.x) / 2
    return `M${a.x} ${a.y} C ${middle} ${a.y}, ${middle} ${b.y}, ${b.x} ${b.y}`
  }
  const middle = (a.y + b.y) / 2
  return `M${a.x} ${a.y} C ${a.x} ${middle}, ${b.x} ${middle}, ${b.x} ${b.y}`
}

const position = (wide: { x: number, y: number }, narrow: { x: number, y: number }) => ({
  '--home-wf-wide-x': `${wide.x}%`,
  '--home-wf-wide-y': `${wide.y}%`,
  '--home-wf-narrow-x': `${narrow.x}%`,
  '--home-wf-narrow-y': `${narrow.y}%`
})

/**
 * Trace a change: the token changes value, and the signal carries it through the classes and files
 * that use it to the stylesheet that ships it, one column of the report at a time. Pointing at,
 * focusing or pressing a node keeps its dependencies and dependents lit with CSS `:has()`.
 */
export default function WorkflowTrace() {
  const $ = useTranslation()
  return (
    <div className="home-wf-figure home-wf-trace" data-wf="trace">
      <div aria-label={$('Impact graph')} className="home-wf-trace-stage" role="group">
        {(['wide', 'narrow'] as const).map((orientation) => (
          <svg aria-hidden="true" className={clsx('home-wf-trace-wires', `home-wf-trace-${orientation}`)} key={orientation} preserveAspectRatio="none" viewBox="0 0 100 100">
            {workflowTraceEdges.map(([from, to], index) => (
              <path className="home-wf-trace-wire" d={edgePath(from, to, orientation)} data-trace={workflowTraceEdgeLists[index]} key={`${from}-${to}`} />
            ))}
            <defs>
              <filter height="300%" id={`home-wf-trace-blur-${orientation}`} width="300%" x="-100%" y="-100%">
                <feGaussianBlur stdDeviation="0.5" />
              </filter>
            </defs>
            {workflowTraceEdges.map(([from, to], index) => (
              <g data-trace={workflowTraceEdgeLists[index]} key={`${from}-${to}`} style={{ '--home-wf-hop': workflowTraceNodes[from][0] } as CSSProperties}>
                <path className="home-wf-trace-trail" d={edgePath(from, to, orientation)} filter={`url(#home-wf-trace-blur-${orientation})`} pathLength={1} />
                <path className="home-wf-trace-signal" d={edgePath(from, to, orientation)} pathLength={1} />
              </g>
            ))}
          </svg>
        ))}
        {/* Glass panes over the wires: what passes behind them softens, the nodes stand in front. */}
        {columnX.map((x, column) => (
          <span aria-hidden="true" className="home-wf-trace-pane" key={column} style={position({ x, y: 50 }, { x: 50, y: tierY[column] + (column === 2 ? 5 : 0) }) as CSSProperties} />
        ))}
        {workflowTraceNodes.map(([column, label, kind], index) => (
          <button
            aria-pressed="false"
            className={clsx('home-wf-trace-node', `home-wf-trace-node-${kind}`)}
            data-node={index}
            data-trace={workflowTraceNodeLists[index]}
            key={label}
            style={{ ...position(point(index, 'wide'), point(index, 'narrow')), '--home-wf-hop': column } as CSSProperties}
            type="button">
            {kind === 'definition'
              ? (
                <>
                  <span>{label}</span>
                  <span aria-hidden="true" className="home-wf-trace-change">
                    <span className="home-wf-trace-swatch" style={{ backgroundColor: workflowTraceChange.before }} />
                    <span className="home-wf-trace-arrow" />
                    <span className="home-wf-trace-swatch home-wf-trace-swatch-after" style={{ backgroundColor: workflowTraceChange.after }} />
                  </span>
                </>
              )
              : (
                <>
                  {kind === 'class' && <span aria-hidden="true" className="home-wf-trace-dot" style={{ '--home-wf-before': workflowTraceChange.before, '--home-wf-after': workflowTraceChange.after } as CSSProperties} />}
                  <span>{label}</span>
                </>
              )}
          </button>
        ))}
      </div>
    </div>
  )
}
