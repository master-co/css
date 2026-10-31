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
            <div className="flex flex-wrap items-baseline justify-between gap-sm">
              <div className="flex items-center gap-xs min-w(0)">
                {item.icon}
                <span id={labelId} className="min-w(0) font-sm (font-weight:460) fg-text-strong benchmark-bar-label"><Translate>{item.label}</Translate></span>
              </div>
              <div className="flex flex-wrap items-baseline gap-xs min-w(0)">
                <strong id={valueId} className="font-sm (font-weight:460) whitespace-nowrap fg-text-strong">{valueLabel}</strong>
                {item.detail && <span className="font-xs fg-text-muted"><Translate>{item.detail}</Translate></span>}
              </div>
            </div>
            <div
              aria-labelledby={`${labelId} ${valueId}`}
              aria-valuemax={itemMax}
              aria-valuemin={0}
              aria-valuenow={item.value}
              className="benchmark-meter"
              role="meter">
              <div
                className={clsx('benchmark-meter-fill', colorClasses.background)}
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
