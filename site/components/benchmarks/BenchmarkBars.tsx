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
    <div className={clsx('grid gap-md benchmark-bars', className)}>
      {items.map((item, index) => {
        const labelId = `${labelPrefix}-label-${index}`
        const valueId = `${labelPrefix}-value-${index}`
        const itemMax = item.max ?? resolvedMax
        const percent = clampPercent(item.value, itemMax)
        const valueLabel = item.valueLabel ?? (valueFormatter ? valueFormatter(item.value) : formatMetricValue(item.value, unit))
        const color = item.color ?? benchmarkColors[index % benchmarkColors.length]
        const colorClasses = benchmarkColorClasses[color]

        return (
          <div key={item.id} className="grid gap-sm">
            <div className="flex items-baseline justify-between gap-sm">
              <div className="flex items-center gap-xs min-w:0">
                {item.icon}
                <span id={labelId} className="min-w:0 font-weight:460 font-sm text-strong benchmark-bar-label"><Translate>{item.label}</Translate></span>
              </div>
              <div className="flex items-baseline gap-xs white-space:nowrap">
                <strong id={valueId} className="font-weight:460 font-sm text-strong">{valueLabel}</strong>
                {item.detail && <span className="font-xs text-muted"><Translate>{item.detail}</Translate></span>}
              </div>
            </div>
            <div
              aria-labelledby={`${labelId} ${valueId}`}
              aria-valuemax={itemMax}
              aria-valuemin={0}
              aria-valuenow={item.value}
              className="overflow:hidden h:10px r-xs bg-surface-muted"
              role="meter">
              <div
                className={clsx('h:100% r-xs', colorClasses.background)}
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
