import '~/site/styles/system/data.css'
import type { ReactNode } from 'react'
import Translate from '~/site/docs-shell/components/Translate'
import type { BenchmarkSampleSummaryStats } from './types'
import { formatMetricValue } from './utils'

interface BenchmarkSampleSummaryProps extends BenchmarkSampleSummaryStats {
  valueFormatter?: (value: number) => ReactNode
}

export default function BenchmarkSampleSummary(props: BenchmarkSampleSummaryProps) {
  const { min, median, mean, max, sampleCount, unit, valueFormatter } = props
  const format = (value: number) => valueFormatter ? valueFormatter(value) : formatMetricValue(value, unit)
  const entries = [
    ['Median', format(median)],
    ['Mean', format(mean)],
    ['Min', format(min)],
    ['Max', format(max)],
    ['Samples', sampleCount.toLocaleString('en-US')]
  ] as const

  return (
    <div className="ui-metrics">
      {entries.map(([label, value]) => (
        <div key={label} className="ui-metric">
          <small><Translate>{label}</Translate></small>
          <b>{value}</b>
        </div>
      ))}
    </div>
  )
}
