import '~/site/styles/system/data.css'
import type { CSSProperties } from 'react'
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
  marker?: { label: string; position: number }
}

/** A conceptual discovery diagram. Keep measured performance in benchmark charts. */
export default function DemoWaterfall({ title, description, rows, marker, caption = 'Illustrative order · no time scale' }: DemoWaterfallProps) {
  if (marker && (!Number.isFinite(marker.position) || marker.position < 0 || marker.position > 100)) throw new Error('Invalid waterfall marker')
  return <Demo title={title} description={description} caption={caption} padding="sm" aria-label={title}>
    <div className="w-full ui-waterfall">
      <div className="ui-waterfall-axis" aria-hidden="true"><span /><div className="relative"><span>Earlier</span>{marker && <span className="absolute font-semibold fg-text-strong (translate:-50%)" style={{ left: `${marker.position}%` }}>{marker.label}</span>}<span>Later</span></div></div>
      {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Preserve WebKit list semantics without list markers. */}
      <ul role="list" className="grid gap-2xs m(0) p(0) (list-style:none)">
        {rows.map(({ label, start, end, tone = 'blue' }) => {
          if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end > 100 || end <= start) throw new Error(`Invalid waterfall interval: ${label}`)
          return <li key={label} className="ui-waterfall-row">
            <span>{label}</span>
            <span className="ui-waterfall-track" aria-hidden="true">
              <i data-tone={tone === 'neutral' ? 'muted' : undefined} style={{ left: `${start}%`, width: `${end - start}%`, ...(tone === 'neutral' ? {} : { background: `var(--ui-tone-${tone})` }) } as CSSProperties} />
              {marker && <span className="ui-waterfall-mark" style={{ left: `${marker.position}%` }} />}
            </span>
          </li>
        })}
      </ul>
    </div>
  </Demo>
}
