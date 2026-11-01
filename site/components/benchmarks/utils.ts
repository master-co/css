import type { BenchmarkColor, BenchmarkTone } from './types'

/** Series take the teaching hues that never read as a status first: blue, violet, then neutral. */
export const benchmarkColors: BenchmarkColor[] = ['blue', 'violet', 'neutral', 'yellow', 'green']

/** Series hues map onto the named teaching tones; a legend always names them. */
const benchmarkTones: Record<BenchmarkColor, 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'neutral'> = {
  blue: 'blue',
  green: 'green',
  yellow: 'amber',
  red: 'red',
  violet: 'violet',
  cyan: 'neutral',
  neutral: 'neutral'
}

export function benchmarkTone(color: BenchmarkColor) {
  return benchmarkTones[color]
}

/** Status of a measured value, never a series color. */
export const benchmarkStatusTones: Record<BenchmarkTone, 'neutral' | 'green' | 'amber' | 'red'> = {
  neutral: 'neutral',
  good: 'green',
  warn: 'amber',
  bad: 'red'
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
