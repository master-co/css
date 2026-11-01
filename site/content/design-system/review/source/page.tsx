import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import { BenchmarkSource } from '~/site/components/benchmarks'
import { benchmarkSnapshots } from '~/site/content/benchmarks/components/BenchmarkSnapshots'

export { metadata }

export default function Page() {
  return <ComponentPage kicker="Documents" title="Evidence footer" description="The source and its recorded date, always beside the claim." sections={[
    { id: 'source', title: 'Source and date', children: <BenchmarkSource {...benchmarkSnapshots['tailwind-static-comparison']} /> },
  ]} usage={{ href: '/benchmarks', label: 'the benchmarks' }} Documentation={ComponentDocumentation} />
}
