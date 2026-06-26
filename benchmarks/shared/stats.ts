import type { BenchmarkMetricUnit, BenchmarkSample, BenchmarkSummary } from './types'

export interface SummaryInput {
    metricId: string
    variantId: string
    unit: BenchmarkMetricUnit
    values: number[]
}

export function summarizeSamples(inputs: SummaryInput[]): BenchmarkSummary[] {
    return inputs.map(({ metricId, variantId, unit, values }) => ({
        metricId,
        variantId,
        unit,
        ...summarizeValues(values)
    }))
}

export function summarizeReportSamples(samples: BenchmarkSample[], units: Map<string, BenchmarkMetricUnit>): BenchmarkSummary[] {
    const grouped = new Map<string, SummaryInput>()

    for (const sample of samples) {
        const key = `${sample.metricId}\0${sample.variantId}`
        let input = grouped.get(key)

        if (!input) {
            input = {
                metricId: sample.metricId,
                variantId: sample.variantId,
                unit: units.get(sample.metricId) || 'count',
                values: []
            }
            grouped.set(key, input)
        }

        input.values.push(sample.value)
    }

    return summarizeSamples([...grouped.values()])
}

export function summarizeValues(values: number[]) {
    const finiteValues = values.filter(Number.isFinite)
    const sorted = [...finiteValues].sort((left, right) => left - right)
    const sum = sorted.reduce((total, value) => total + value, 0)
    const middle = Math.floor(sorted.length / 2)

    return {
        min: sorted[0] ?? 0,
        median: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2 || 0,
        mean: sorted.length ? sum / sorted.length : 0,
        max: sorted[sorted.length - 1] ?? 0,
        sampleCount: sorted.length
    }
}
