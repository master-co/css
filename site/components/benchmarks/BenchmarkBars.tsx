import '~/site/styles/benchmarks.css'
import { useId, type ReactNode } from 'react'
import clsx from 'clsx'
import Translate from '~/site/docs-shell/components/Translate'
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
  const labelPrefix = useId()
  const { items, max, unit, valueFormatter, className } = props
  const resolvedMax = max ?? Math.max(0, ...items.map((item) => item.max ?? item.value))

  return (
    <div className={clsx('display:grid gap-md benchmark-bars', className)}>
      {items.map((item, index) => {
        const labelId = `${labelPrefix}-label-${index}`
        const valueId = `${labelPrefix}-value-${index}`
        const itemMax = item.max ?? resolvedMax
        const percent = clampPercent(item.value, itemMax)
        const valueLabel = item.valueLabel ?? (valueFormatter ? valueFormatter(item.value) : formatMetricValue(item.value, unit))
        const color = item.color ?? benchmarkColors[index % benchmarkColors.length]
        const colorClasses = benchmarkColorClasses[color]

        return (
          <div key={item.id} className="display:grid gap-sm">
            <div className="display:flex align-items:baseline justify-content:space-between gap-sm">
              <div className="display:flex align-items:center gap-xs min-width:0">
                {item.icon}
                <span id={labelId} className="min-width:0 font-size-sm font-weight:460 fg-text-strong benchmark-bar-label"><Translate>{item.label}</Translate></span>
              </div>
              <div className="display:flex align-items:baseline gap-xs white-space:nowrap">
                <strong id={valueId} className="font-size-sm font-weight:460 fg-text-strong">{valueLabel}</strong>
                {item.detail && <span className="font-size-xs fg-text-muted"><Translate>{item.detail}</Translate></span>}
              </div>
            </div>
            <div
              aria-labelledby={`${labelId} ${valueId}`}
              aria-valuemax={itemMax}
              aria-valuemin={0}
              aria-valuenow={item.value}
              className="overflow:hidden height:10px r-xs bg-surface-inset"
              role="meter">
              <div
                className={clsx('height:100% r-xs', colorClasses.background)}
                style={{
                  width: `${percent}%`
                }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
