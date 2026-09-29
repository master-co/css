import '~/site/styles/benchmarks.css'
import { useId, type ReactNode } from 'react'
import clsx from 'clsx'
import Translate from '~/site/docs-shell/components/Translate'
import type { BenchmarkStackedBarItem } from './types'
import { benchmarkColorClasses, benchmarkColors, clampPercent, formatMetricValue } from './utils'

interface BenchmarkStackedBarsProps {
  items: BenchmarkStackedBarItem[]
  unit?: string
  valueFormatter?: (value: number) => ReactNode
  className?: string
}

export default function BenchmarkStackedBars(props: BenchmarkStackedBarsProps) {
  const labelPrefix = useId()
  const { items, unit, valueFormatter, className } = props

  return (
    <div className={clsx('display:grid gap-lg benchmark-bars benchmark-stacks', className)}>
      {items.map((item, index) => {
        const labelId = `${labelPrefix}-label-${index}`
        const valueId = `${labelPrefix}-value-${index}`
        const total = item.total ?? item.segments.reduce((sum, segment) => sum + segment.value, 0)
        const totalLabel = valueFormatter ? valueFormatter(total) : formatMetricValue(total, unit)

        return (
          <div key={item.id} className="display:grid gap-sm">
            <div className="display:flex align-items:baseline justify-content:space-between gap-sm">
              <div className="display:flex align-items:center gap-xs min-width:0">
                {item.icon}
                <span id={labelId} className="min-width:0 font-size-sm font-weight:460 fg-text-strong benchmark-bar-label"><Translate>{item.label}</Translate></span>
              </div>
              <div className="display:flex align-items:baseline gap-xs white-space:nowrap">
                <strong id={valueId} className="font-size-sm font-weight:460 fg-text-strong">{totalLabel}</strong>
                {item.detail && <span className="font-size-xs fg-text-muted"><Translate>{item.detail}</Translate></span>}
              </div>
            </div>
            <div className="display:flex overflow:hidden height:12px r-xs bg-surface-inset" role="img" aria-labelledby={`${labelId} ${valueId}`}>
              {item.segments.map((segment, index) => {
                const percent = clampPercent(segment.value, total)
                const color = segment.color ?? benchmarkColors[index % benchmarkColors.length]
                const colorClasses = benchmarkColorClasses[color]

                return (
                  <div
                    key={segment.id}
                    className={colorClasses.background}
                    title={`${segment.label}: ${segment.valueLabel ?? formatMetricValue(segment.value, unit)}`}
                    style={{
                      flexBasis: `${percent}%`,
                      flexGrow: 0,
                      flexShrink: 0
                    }} />
                )
              })}
            </div>
            <div className="display:flex flex-wrap:wrap row-gap:var(--spacing-xs) column-gap:var(--spacing-sm)" role="group" aria-label={`${item.label} breakdown`}>
              {item.segments.map((segment, index) => {
                const color = segment.color ?? benchmarkColors[index % benchmarkColors.length]
                const colorClasses = benchmarkColorClasses[color]
                const valueLabel = segment.valueLabel ?? (valueFormatter ? valueFormatter(segment.value) : formatMetricValue(segment.value, unit))

                return (
                  <div key={segment.id} className="display:inline-flex align-items:center gap-2xs font-size-xs fg-text-muted">
                    <span className={clsx('display:inline-block height:0.625rem width:0.625rem r-xs', colorClasses.background)} />
                    <span><Translate>{segment.label}</Translate></span>
                    <span className="fg-text-strong">{valueLabel}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
