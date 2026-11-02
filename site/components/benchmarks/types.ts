export type BenchmarkTone = 'neutral' | 'good' | 'warn' | 'bad'
export type BenchmarkColor = 'yellow' | 'green' | 'cyan' | 'blue' | 'red' | 'violet' | 'neutral'

/** A decorative image before a row label; the label always names the row. */
export interface BenchmarkIcon {
  src: string
  width?: number
  height?: number
  class?: string
}

export interface BenchmarkBarItem {
  id: string
  label: string
  /** A quieter note set right after the label, such as a comparison ratio. */
  labelNote?: string
  value: number
  max?: number
  valueLabel?: string
  detail?: string
  icon?: BenchmarkIcon
  color?: BenchmarkColor
}

export interface BenchmarkSegment {
  id: string
  label: string
  value: number
  valueLabel?: string
  color?: BenchmarkColor
}

export interface BenchmarkStackedBarItem {
  id: string
  label: string
  segments: BenchmarkSegment[]
  total?: number
  detail?: string
  icon?: BenchmarkIcon
}

export interface BenchmarkMetric {
  label: string
  value: string | number
  detail?: string
  tone?: BenchmarkTone
}

export interface BenchmarkSampleSummaryStats {
  min: number
  median: number
  mean: number
  max: number
  sampleCount: number
  unit?: string
}

export interface BenchmarkBarsProps {
  items: BenchmarkBarItem[]
  max?: number
  unit?: string
  valueFormatter?: (value: number) => string
}

export interface BenchmarkStackedBarsProps {
  items: BenchmarkStackedBarItem[]
  max?: number
  unit?: string
  valueFormatter?: (value: number) => string
}

/** One metric's bars under a small heading that names its statistic. */
export interface BenchmarkChartGroupModel {
  title: string
  detail: string
  items: BenchmarkBarItem[]
  unit?: string
}

/**
 * An authored benchmark chart as data. `BenchmarkChart.astro` renders it on the page and
 * `utils/benchmark-content` serializes the same object into Markdown, so both always agree.
 */
export type BenchmarkChartModel =
  | { kind: 'bars' } & BenchmarkBarsProps
  | { kind: 'stacked-bars' } & BenchmarkStackedBarsProps
  | { kind: 'metric-table'; label: string; metrics: BenchmarkMetric[] }
  | { kind: 'chart-groups'; groups: BenchmarkChartGroupModel[] }
  | {
    kind: 'data-table'
    /** Names the scrollable region. */
    label: string
    /** First column, counted from 1, that holds numbers. */
    numericFrom: number
    headers: string[]
    /** The first cell of each row is its row header. */
    rows: (string | number)[][]
  }
