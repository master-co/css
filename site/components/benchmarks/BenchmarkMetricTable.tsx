import clsx from 'clsx'
import Translate from '~/internal/components/Translate'
import type { BenchmarkMetric } from './types'
import { benchmarkToneTextClasses } from './utils'

interface BenchmarkMetricTableProps {
    metrics: BenchmarkMetric[]
}

export default function BenchmarkMetricTable(props: BenchmarkMetricTableProps) {
    const { metrics } = props
    const hasDetails = metrics.some((metric) => metric.detail)

    return (
        <div className="doc-table">
            <table>
                <thead>
                    <tr>
                        <th><Translate>Metric</Translate></th>
                        <th><Translate>Value</Translate></th>
                        {hasDetails && <th><Translate>Detail</Translate></th>}
                    </tr>
                </thead>
                <tbody>
                    {metrics.map((metric) => (
                        <tr key={String(metric.label)}>
                            <th><Translate>{metric.label}</Translate></th>
                            <td className={clsx(benchmarkToneTextClasses[metric.tone ?? 'neutral'])}>{metric.value}</td>
                            {hasDetails && <td><Translate>{metric.detail}</Translate></td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
