import '~/site/styles/benchmark-metrics.css'
import clsx from 'clsx'
import Translate from '~/site/docs-shell/components/Translate'
import type { BenchmarkMetric } from './types'
import { benchmarkToneTextClasses } from './utils'

export default function BenchmarkMetrics({ metrics }: { metrics: BenchmarkMetric[] }) {
  return (
    <dl className="benchmark-metrics">
      {metrics.map((metric, index) => (
        <div key={index} className="benchmark-metric">
          <dt><Translate>{metric.label}</Translate></dt>
          <dd className={clsx('benchmark-metric-value', metric.tone ? benchmarkToneTextClasses[metric.tone] : 'text-strong')}>{metric.value}</dd>
          {metric.detail && <dd className="benchmark-metric-detail"><Translate>{metric.detail}</Translate></dd>}
        </div>
      ))}
    </dl>
  )
}
