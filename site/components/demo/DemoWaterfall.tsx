import Demo from './Demo'
import type { DemoTone } from './primitives'

export interface DemoWaterfallRow {
  label: string
  /** Normalized visual positions, not measured durations. */
  start: number
  end: number
  tone?: DemoTone
}

export interface DemoWaterfallProps {
  title: string
  description: string
  rows: readonly DemoWaterfallRow[]
  caption?: string
}

/** A conceptual discovery diagram. Keep measured performance in benchmark charts. */
export default function DemoWaterfall({ title, description, rows, caption = 'Illustrative order · no time scale' }: DemoWaterfallProps) {
  return <figure className="demo-waterfall" aria-label={title}>
    <Demo title={title} description={description} caption={caption} background="plain" padding="md">
      <div className="demo-waterfall-axis" aria-hidden="true"><span>Earlier</span><span>Later</span></div>
      {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Preserve WebKit list semantics with list-style:none. */}
      <ul role="list" className="demo-waterfall-rows">
        {rows.map(({ label, start, end, tone = 'blue' }) => {
          if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end > 100 || end <= start) throw new Error(`Invalid waterfall interval: ${label}`)
          return <li key={label}>
            <span className="demo-waterfall-label">{label}</span>
            <span className="demo-waterfall-track" aria-hidden="true">
              <span className="demo-waterfall-bar" data-tone={tone} style={{ left: `${start}%`, width: `${end - start}%` }} />
            </span>
          </li>
        })}
      </ul>
    </Demo>
  </figure>
}
