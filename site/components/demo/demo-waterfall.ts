import type { DemoTone } from './tone'

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
