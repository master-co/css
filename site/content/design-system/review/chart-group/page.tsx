import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import { BenchmarkChartGroup, type BenchmarkBarItem } from '~/site/components/benchmarks'
import { StaticCSSOutputChart } from '~/site/content/benchmarks/components/StaticTailwindComparison'

export { metadata }

const items: BenchmarkBarItem[] = [
  { id: 'a', label: 'Fixture A', value: 18.4, color: 'blue', detail: '10 samples' },
  { id: 'b', label: 'Fixture B', value: 28.6, color: 'violet', detail: '10 samples' },
  { id: 'c', label: 'Fixture C', value: 0, color: 'neutral', detail: 'no recorded output' }
]

export default function Page() {
  return <ComponentPage kicker="Documents" title="Chart group" description="Units, series and sample context together." sections={[
    { id: 'group', title: 'A chart group', children: <BenchmarkChartGroup title="Compressed CSS" detail="Brotli · 10 samples" items={items} unit="kB" /> },
    { id: 'benchmarks', title: 'In the benchmarks', children: <StaticCSSOutputChart /> },
  ]} usage={{ href: '/benchmarks', label: 'the benchmarks' }} Documentation={ComponentDocumentation} />
}
