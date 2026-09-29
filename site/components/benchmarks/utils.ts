import type { BenchmarkColor, BenchmarkTone } from './types'

export const benchmarkColors: BenchmarkColor[] = ['blue', 'green', 'yellow', 'cyan', 'red']

export const benchmarkColorClasses: Record<BenchmarkColor, { background: string; text: string }> = {
  yellow: { background: 'bg-yellow', text: 'fg-text-yellow' },
  green: { background: 'bg-green', text: 'fg-text-green' },
  cyan: { background: 'bg-cyan', text: 'fg-text-cyan' },
  blue: { background: 'bg-blue', text: 'fg-text-blue' },
  red: { background: 'bg-red', text: 'fg-text-red' },
  violet: { background: 'bg-violet', text: 'fg-violet' },
  neutral: { background: 'bg-neutral', text: 'fg-neutral' }
}

export const benchmarkToneTextClasses: Record<BenchmarkTone, string> = {
  neutral: 'fg-text-muted',
  good: 'fg-text-green',
  warn: 'fg-text-yellow',
  bad: 'fg-text-red'
}

export function clampPercent(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0
  return Math.max(0, Math.min(100, value / max * 100))
}

export function formatMetricNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value >= 10 ? 1 : 2
  }).format(value)
}

export function formatMetricValue(value: number, unit?: string) {
  return unit ? `${formatMetricNumber(value)} ${unit}` : formatMetricNumber(value)
}
