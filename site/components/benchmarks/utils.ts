import type { BenchmarkColor, BenchmarkTone } from './types'

export const benchmarkColors: BenchmarkColor[] = ['blue', 'green', 'yellow', 'cyan', 'red']

export const benchmarkColorClasses: Record<BenchmarkColor, { background: string; text: string }> = {
    yellow: { background: 'bg:yellow', text: 'text:yellow' },
    green: { background: 'bg:green', text: 'text:green' },
    cyan: { background: 'bg:cyan', text: 'text:cyan' },
    blue: { background: 'bg:blue', text: 'text:blue' },
    red: { background: 'bg:red', text: 'text:red' }
}

export const benchmarkToneTextClasses: Record<BenchmarkTone, string> = {
    neutral: 'text:muted',
    good: 'text:green',
    warn: 'text:yellow',
    bad: 'text:red'
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
