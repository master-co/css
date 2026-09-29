import Link from 'next/link'

import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import { BenchmarkMetricTable, BenchmarkMetrics, type BenchmarkMetric } from '~/site/components/benchmarks'

import { StaticComparisonSummary } from '~/site/app/[locale]/guide/benchmarks/components/StaticTailwindComparison'
import './page.css'

export const metadata = {
  title: 'Benchmark metrics review',
  description: 'Current Benchmark metrics and practical examples.'
}

const metrics: BenchmarkMetric[] = [
  { label: 'Fixture', value: 'dashboard', detail: 'Matched visual intent across variants' },
  { label: 'Median build', value: '148 ms', tone: 'good', detail: '10 measured command rounds' },
  { label: 'CSS rules', value: '1,284', detail: 'After static extraction and pruning' },
  { label: 'Long tasks', value: '0', tone: 'good', detail: 'Chromium trace sample' }
]

const options = [
  { number: '01', title: 'Current', detail: 'Refined measurement rows', preview: <BenchmarkMetrics metrics={metrics} />, note: "The current shared style gives the row a calmer baseline, a more legible numeric value, and a clear detail line at narrow widths. It keeps native definition-list semantics." }
] as const

export default function Page() {
  return <main className="review-metrics-review">
    <div className="review-metrics-kicker">Design system · Component review 21</div>
    <h1>Benchmark metrics</h1>
    <p className="review-metrics-intro">The current shared style gives the row a calmer baseline, a more legible numeric value, and a clear detail line at narrow widths. It keeps native definition-list semantics.</p>

    <label htmlFor="metrics-review-theme" className="review-metrics-themeControl"><span>Preview theme</span><span className="review-metrics-themeSelect">Light · Dark · System<ThemeSelect id="metrics-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="metrics-options">
      <h2 id="metrics-options">Metric treatments</h2>

      <div className="review-metrics-options">{options.map(({ number, title, detail, preview, note }) => <article className="review-metrics-option" key={number}>
        <div className="review-metrics-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
        <div className="review-metrics-optionPreview">{preview}</div>
        <p className="review-metrics-optionNote">{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="metrics-real-use">
      <div className="review-metrics-sectionHeading"><div><h2 id="metrics-real-use">Actual Guide use</h2><p>The live static-comparison summary is still rendered from committed benchmark results.</p></div><Link href="/guide/benchmarks#static-css-output-structure-and-production-build">Open /guide/benchmarks</Link></div>
      <div className="review-metrics-realUse"><StaticComparisonSummary /></div>
      <p className="review-metrics-optionNote">The current component affects only the optional compact summary list. Guide tables and their surrounding caveats remain intact.</p>
    </section>
  </main>
}
