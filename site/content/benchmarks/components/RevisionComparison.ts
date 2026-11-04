import snapshot from '~/site/.generated/benchmarks/revision-comparison.json'
import type { BenchmarkChartModel } from '@master/internal-site/benchmarks/types.ts'

type Row = {
  group: string
  label: string
  unit: 'B' | 'ms' | 'count'
  baseline: { median: number, sampleCount: number }
  current: { median: number, sampleCount: number }
}

const rows = snapshot.rows as Row[]

function formatValue(value: number, unit: Row['unit']) {
  if (unit === 'B') return value >= 1000 ? `${(value / 1000).toFixed(1)} kB` : `${value} B`
  if (unit === 'ms') return `${value.toFixed(1)} ms`
  return String(value)
}

function formatChange(row: Row) {
  const { median: before } = row.baseline
  const { median: after } = row.current
  if (before === after) return 'Same'
  if (!before) return 'New'
  const ratio = after / before
  if (ratio >= 2 || ratio <= 0.5) return `${ratio.toFixed(1)}×`
  return `${ratio > 1 ? '+' : '−'}${Math.round(Math.abs(ratio - 1) * 100)}%`
}

/** One machine and one Chromium build: the last revision before the Rust engine against the current revision. */
export const RevisionComparisonTable = {
  kind: 'data-table',
  label: 'Before and after the Rust engine on the same machine',
  numericFrom: 3,
  headers: ['Measurement', 'Area', snapshot.revisions.baseline.label, snapshot.revisions.current.label, 'Change'],
  rows: rows.map((row) => [
    row.label,
    row.group,
    formatValue(row.baseline.median, row.unit),
    formatValue(row.current.median, row.unit),
    formatChange(row)
  ])
} satisfies BenchmarkChartModel
