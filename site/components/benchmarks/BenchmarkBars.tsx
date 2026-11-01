import '~/site/styles/system/data.css'
import '~/site/styles/benchmarks.css'
import { useId, type ReactNode } from 'react'
import Translate from '~/site/docs-shell/components/Translate'
import type { BenchmarkBarItem } from './types'
import { clampPercent, formatMetricValue } from './utils'

interface BenchmarkBarsProps {
  items: BenchmarkBarItem[]
  max?: number
  unit?: string
  valueFormatter?: (value: number) => ReactNode
  className?: string
}

/** Rows of one measurement: every bar is named by its row, so bars stay ink. */
export function BenchmarkBarRows({ items, max, unit, valueFormatter }: BenchmarkBarsProps) {
  const labelPrefix = useId()
  const resolvedMax = max ?? Math.max(0, ...items.map((item) => item.max ?? item.value))
  return items.map((item, index) => {
    const labelId = `${labelPrefix}-label-${index}`
    const valueId = `${labelPrefix}-value-${index}`
    const itemMax = item.max ?? resolvedMax
    const valueLabel = item.valueLabel ?? (valueFormatter ? valueFormatter(item.value) : formatMetricValue(item.value, unit))
    return <div key={item.id} className="ui-chart-row">
      <span>
        {item.icon}
        <span id={labelId}><Translate>{item.label}</Translate></span>
        {item.detail && <small><Translate>{item.detail}</Translate></small>}
      </span>
      <div className="ui-bar" role="meter" aria-labelledby={`${labelId} ${valueId}`} aria-valuemin={0} aria-valuemax={itemMax} aria-valuenow={item.value}>
        <i data-tone={item.color === 'neutral' ? 'muted' : undefined} style={{ width: `${clampPercent(item.value, itemMax)}%` }} />
      </div>
      <output id={valueId}>{valueLabel}</output>
    </div>
  })
}

export default function BenchmarkBars({ className, ...props }: BenchmarkBarsProps) {
  return <div className={className ? `ui-chart ${className}` : 'ui-chart'}><BenchmarkBarRows {...props} /></div>
}
