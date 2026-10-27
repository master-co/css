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
    <dl className="grid-cols(2) display:grid gap-xs grid-cols(5)@sm">
      {entries.map(([label, value]) => (
        <div key={label} className="p-sm r-sm bg-surface-inset">
          <dt className="font-xs fg-text-muted"><Translate>{label}</Translate></dt>
          <dd className="margin-inline:0 mt-2xs margin-bottom:0 font-sm font-weight:460 fg-text-strong">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
