import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import { BenchmarkMetrics, type BenchmarkMetric } from '~/site/components/benchmarks'
import { StaticComparisonSummary } from '~/site/content/benchmarks/components/StaticTailwindComparison'

export { metadata }

const metrics: BenchmarkMetric[] = [
  { label: 'Fixture', value: 'dashboard', detail: 'Matched visual intent across variants' },
  { label: 'Median build', value: '148 ms', tone: 'good', detail: '10 measured command rounds' },
  { label: 'CSS rules', value: '1,284', detail: 'After static extraction and pruning' },
  { label: 'Long tasks', value: '0', tone: 'good', detail: 'Chromium trace sample' }
]

export default function Page() {
  return <ComponentPage kicker="Documents" title="Metric rows" description="Aligned values with their caveats." sections={[
    { id: 'metrics', title: 'Metrics', children: <BenchmarkMetrics metrics={metrics} /> },
    { id: 'benchmarks', title: 'In the benchmarks', children: <StaticComparisonSummary /> },
  ]} usage={{ href: '/benchmarks', label: 'the benchmarks' }} Documentation={ComponentDocumentation} />
}
