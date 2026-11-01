import '~/site/styles/system/data.css'
import '~/site/styles/system/specimens.css'
import '~/site/styles/benchmarks.css'
import { useId, type ReactNode } from 'react'
import Translate from '~/site/docs-shell/components/Translate'
import type { BenchmarkStackedBarItem } from './types'
import { benchmarkColors, benchmarkTone, clampPercent, formatMetricValue } from './utils'

interface BenchmarkStackedBarsProps {
  items: BenchmarkStackedBarItem[]
  max?: number
  unit?: string
  valueFormatter?: (value: number) => ReactNode
  className?: string
}

/** Segments carry hue only because each row's legend names them with their values. */
export default function BenchmarkStackedBars(props: BenchmarkStackedBarsProps) {
  const labelPrefix = useId()
  const { items, max, unit, valueFormatter, className } = props

  return (
    <div className={className ? `ui-chart ${className}` : 'ui-chart'}>
      {items.map((item, index) => {
        const labelId = `${labelPrefix}-label-${index}`
        const valueId = `${labelPrefix}-value-${index}`
        const total = item.total ?? item.segments.reduce((sum, segment) => sum + segment.value, 0)
        const totalLabel = valueFormatter ? valueFormatter(total) : formatMetricValue(total, unit)

        return (
          <div key={item.id} className="ui-chart-row">
            <span>
              {item.icon}
              <span id={labelId}><Translate>{item.label}</Translate></span>
              {item.detail && <small><Translate>{item.detail}</Translate></small>}
            </span>
            <div className="ui-bar" data-variant="stacked" role="img" aria-labelledby={`${labelId} ${valueId}`}>
              {item.segments.map((segment, segmentIndex) => <i
                key={segment.id}
                data-tone={benchmarkTone(segment.color ?? benchmarkColors[segmentIndex % benchmarkColors.length])}
                title={`${segment.label}: ${segment.valueLabel ?? formatMetricValue(segment.value, unit)}`}
                style={{ width: `${clampPercent(segment.value, max ?? total)}%` }} />)}
            </div>
            <output id={valueId}>{totalLabel}</output>
            <ul className="ui-legend" role="group" aria-label={`${item.label} breakdown`}>
              {item.segments.map((segment, segmentIndex) => {
                const valueLabel = segment.valueLabel ?? (valueFormatter ? valueFormatter(segment.value) : formatMetricValue(segment.value, unit))
                return <li key={segment.id}>
                  <i data-tone={benchmarkTone(segment.color ?? benchmarkColors[segmentIndex % benchmarkColors.length])} />
                  <span><Translate>{segment.label}</Translate></span>
                  <b>{valueLabel}</b>
                </li>
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
