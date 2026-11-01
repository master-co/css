import '~/site/styles/system/data.css'
import Translate from '~/site/docs-shell/components/Translate'
import BenchmarkStatus from './BenchmarkStatus'
import type { BenchmarkMetric } from './types'

interface BenchmarkMetricTableProps {
  metrics: BenchmarkMetric[]
  /** Names the scrollable region; several metric tables share a page, so each needs its own name. */
  label?: string
}

export default function BenchmarkMetricTable(props: BenchmarkMetricTableProps) {
  const { metrics, label = 'Benchmark metrics' } = props
  const hasDetails = metrics.some((metric) => metric.detail)

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Preserve keyboard access to wide metric tables.
    <div className="ui-table" role="region" aria-label={label} tabIndex={0}>
      <table>
        <thead>
          <tr>
            <th scope="col"><Translate>Metric</Translate></th>
            <th scope="col"><Translate>Value</Translate></th>
            {hasDetails && <th scope="col"><Translate>Detail</Translate></th>}
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={String(metric.label)}>
              <th scope="row"><Translate>{metric.label}</Translate></th>
              <td className="benchmark-value">{metric.value} <BenchmarkStatus tone={metric.tone} /></td>
              {hasDetails && <td><Translate>{metric.detail}</Translate></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
