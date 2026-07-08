import type { ReactNode } from 'react'
import Translate from '~/internal/components/Translate'
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
    <dl className="grid grid-cols:2 gap:xs grid-cols:5@sm">
      {entries.map(([label, value]) => (
        <div key={label} className="p:sm r:sm bg:surface-muted">
          <dt className="font:xs text:muted"><Translate>{label}</Translate></dt>
          <dd className="mx:0 mb:0 mt:2xs font-weight:460 font:sm text:strong">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
