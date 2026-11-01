import '~/site/styles/system/data.css'
import Translate from '~/site/docs-shell/components/Translate'
import BenchmarkStatus from './BenchmarkStatus'
import type { BenchmarkMetric } from './types'

export default function BenchmarkMetrics({ metrics }: { metrics: BenchmarkMetric[] }) {
  return (
    <div className="ui-metrics">
      {metrics.map((metric, index) => (
        <div key={index} className="ui-metric">
          <small><Translate>{metric.label}</Translate></small>
          <b>{metric.value}</b>
          {(metric.detail || (metric.tone && metric.tone !== 'neutral')) && <p><BenchmarkStatus tone={metric.tone} /> <Translate>{metric.detail}</Translate></p>}
        </div>
      ))}
    </div>
  )
}
