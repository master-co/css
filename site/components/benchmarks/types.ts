import type { ReactNode } from 'react'

export type BenchmarkTone = 'neutral' | 'good' | 'warn' | 'bad'
export type BenchmarkColor = 'yellow' | 'green' | 'cyan' | 'blue' | 'red'

export interface BenchmarkBarItem {
    id: string
    label: ReactNode
    value: number
    max?: number
    valueLabel?: ReactNode
    detail?: ReactNode
    icon?: ReactNode
    color?: BenchmarkColor
}

export interface BenchmarkSegment {
    id: string
    label: ReactNode
    value: number
    valueLabel?: ReactNode
    color?: BenchmarkColor
}

export interface BenchmarkStackedBarItem {
    id: string
    label: ReactNode
    segments: BenchmarkSegment[]
    total?: number
    detail?: ReactNode
    icon?: ReactNode
}

export interface BenchmarkMetric {
    label: ReactNode
    value: ReactNode
    detail?: ReactNode
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
