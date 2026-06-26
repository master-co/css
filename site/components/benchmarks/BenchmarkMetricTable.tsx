import clsx from 'clsx'
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
                        <th>Metric</th>
                        <th>Value</th>
                        {hasDetails && <th>Detail</th>}
                    </tr>
                </thead>
                <tbody>
                    {metrics.map((metric) => (
                        <tr key={String(metric.label)}>
                            <th>{metric.label}</th>
                            <td className={clsx(benchmarkToneTextClasses[metric.tone ?? 'neutral'])}>{metric.value}</td>
                            {hasDetails && <td>{metric.detail}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
