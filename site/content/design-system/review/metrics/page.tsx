import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'

import AppearanceControl from '../../components/AppearanceControl'
import { BenchmarkMetricTable, BenchmarkMetrics, type BenchmarkMetric } from '~/site/components/benchmarks'

import { StaticComparisonSummary } from '~/site/content/guide/benchmarks/components/StaticTailwindComparison'
import './page.css'

export { metadata }

const metrics: BenchmarkMetric[] = [
  { label: 'Fixture', value: 'dashboard', detail: 'Matched visual intent across variants' },
  { label: 'Median build', value: '148 ms', tone: 'good', detail: '10 measured command rounds' },
  { label: 'CSS rules', value: '1,284', detail: 'After static extraction and pruning' },
  { label: 'Long tasks', value: '0', tone: 'good', detail: 'Chromium trace sample' }
]

const options = [
  { number: '01', preview: <BenchmarkMetrics metrics={metrics} />, note: "The current shared style gives the row a calmer baseline, a more legible numeric value, and a clear detail line at narrow widths. It keeps native definition-list semantics." }
] as const

export default function Page() {
  return <main className="ds-component-page review-metrics-review">
    <ReviewNavigation />
    <h1>Benchmark metrics</h1>
    <p className="review-metrics-intro">The current shared style gives the row a calmer baseline, a more legible numeric value, and a clear detail line at narrow widths. It keeps native definition-list semantics.</p>

    <AppearanceControl label="Preview theme" />

    <section aria-labelledby="metrics-options">
      <h2 id="metrics-options">Metric treatments</h2>

      <div className="review-metrics-options">{options.map(({ number, preview, note }) => <article className="review-metrics-option" key={number}>
        <div className="review-metrics-optionPreview">{preview}</div>
        <p className="review-metrics-optionNote">{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="metrics-real-use">
      <div className="review-metrics-sectionHeading"><div><h2 id="metrics-real-use">Actual Guide use</h2><p>The live static-comparison summary is still rendered from committed benchmark results.</p></div><Link href="/guide/benchmarks#static-css-output-structure-and-production-build">Open /guide/benchmarks</Link></div>
      <div className="review-metrics-realUse"><StaticComparisonSummary /></div>
      <p className="review-metrics-optionNote">The current component affects only the optional compact summary list. Guide tables and their surrounding caveats remain intact.</p>
    </section>
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
