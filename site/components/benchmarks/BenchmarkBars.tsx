import type { ReactNode } from 'react'
import clsx from 'clsx'
import type { BenchmarkBarItem } from './types'
import { benchmarkColorClasses, benchmarkColors, clampPercent, formatMetricValue } from './utils'

interface BenchmarkBarsProps {
    items: BenchmarkBarItem[]
    max?: number
    unit?: string
    valueFormatter?: (value: number) => ReactNode
    className?: string
}

export default function BenchmarkBars(props: BenchmarkBarsProps) {
    const { items, max, unit, valueFormatter, className } = props
    const resolvedMax = max ?? Math.max(0, ...items.map((item) => item.max ?? item.value))

    return (
        <div className={clsx('grid gap:md', className)}>
            {items.map((item, index) => {
                const itemMax = item.max ?? resolvedMax
                const percent = clampPercent(item.value, itemMax)
                const valueLabel = item.valueLabel ?? (valueFormatter ? valueFormatter(item.value) : formatMetricValue(item.value, unit))
                const color = item.color ?? benchmarkColors[index % benchmarkColors.length]
                const colorClasses = benchmarkColorClasses[color]

                return (
                    <div key={item.id} className="grid gap:sm">
                        <div className="flex items-baseline justify-between gap:sm">
                            <div className="flex items-center gap:xs min-w:0">
                                {item.icon}
                                <span className="overflow:hidden min-w:0 font-weight:460 font:sm text-ellipsis white-space:nowrap text:strong">{item.label}</span>
                            </div>
                            <div className="flex items-baseline gap:xs white-space:nowrap">
                                <strong className="font-weight:460 font:sm text:strong">{valueLabel}</strong>
                                {item.detail && <span className="font:xs text:muted">{item.detail}</span>}
                            </div>
                        </div>
                        <div
                            aria-label={`${item.label}: ${valueLabel}`}
                            aria-valuemax={itemMax}
                            aria-valuemin={0}
                            aria-valuenow={item.value}
                            className="overflow:hidden h:10px r:xs bg:surface-muted"
                            role="meter">
                            <div
                                className={clsx('h:full r:xs', colorClasses.background, percent <= 0 && 'opacity:.45')}
                                style={{
                                    width: percent > 0 ? `${percent}%` : '1px'
                                }} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
