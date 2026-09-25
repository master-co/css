import Link from 'next/link'
import clsx from 'clsx'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import { BenchmarkMetricTable, BenchmarkMetrics, type BenchmarkMetric } from '~/site/components/benchmarks'
import { benchmarkToneTextClasses } from '~/site/components/benchmarks/utils'
import { StaticComparisonSummary } from '~/site/app/[locale]/guide/benchmarks/components/StaticTailwindComparison'
import './page.css'

export const metadata = {
  title: 'Benchmark metrics review',
  description: 'Compare the established summary table, current definition list and a refined candidate.'
}

const metrics: BenchmarkMetric[] = [
  { label: 'Fixture', value: 'dashboard', detail: 'Matched visual intent across variants' },
  { label: 'Median build', value: '148 ms', tone: 'good', detail: '10 measured command rounds' },
  { label: 'CSS rules', value: '1,284', detail: 'After static extraction and pruning' },
  { label: 'Long tasks', value: '0', tone: 'good', detail: 'Chromium trace sample' }
]

function PreviousMetrics() {
  return <dl className="review-metrics-previousMetrics">
    {metrics.map(metric => <div className="review-metrics-previousMetric" key={String(metric.label)}>
      <dt>{metric.label}</dt><dd className={clsx('review-metrics-previousValue', benchmarkToneTextClasses[metric.tone ?? 'neutral'])}>{metric.value}</dd><dd className="review-metrics-previousDetail">{metric.detail}</dd>
    </div>)}
  </dl>
}

const options = [
  { number: '01', title: 'Original Guide', detail: 'Native summary table', preview: <BenchmarkMetricTable metrics={metrics} />, note: 'The original benchmark summary keeps headings and values in a familiar table, which remains useful for complete fixture reports.' },
  { number: '02', title: 'Previous shared', detail: 'Responsive definition list', preview: <PreviousMetrics />, note: 'The previous shared list emphasized a short set of headline metrics with labels, values and contextual details.' },
  { number: '03', title: 'Adopted', detail: 'Refined measurement rows', preview: <BenchmarkMetrics metrics={metrics} />, note: 'The adopted shared style gives the row a calmer baseline, a more legible numeric value, and a clear detail line at narrow widths. It keeps native definition-list semantics.' }
] as const

export default function Page() {
  return <main className="review-metrics-review">
    <div className="review-metrics-kicker">Design system · Component review 21</div>
    <h1>Benchmark metrics</h1>
    <p className="review-metrics-intro">The benchmark Guide has a useful full-data table. The newer summary list should provide a quick read of selected metrics without replacing that table or changing the recorded numbers.</p>
    <div className="review-metrics-reviewNote" role="note">Adopted shared style: <code>BenchmarkMetrics</code> now uses the refined measurement rows. The published Guide keeps its original tables.</div>
    <label htmlFor="metrics-review-theme" className="review-metrics-themeControl"><span>Preview theme</span><span className="review-metrics-themeSelect">Light · Dark · System<ThemeSelect id="metrics-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="metrics-options">
      <h2 id="metrics-options">Metric treatments</h2>
      <p className="review-metrics-sectionCopy">The same illustrative values appear in all three treatments. Look at label-to-value alignment and where the detail sits as the width changes.</p>
      <div className="review-metrics-options">{options.map(({ number, title, detail, preview, note }) => <article className="review-metrics-option" key={number}>
        <div className="review-metrics-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
        <div className="review-metrics-optionPreview">{preview}</div>
        <p className="review-metrics-optionNote">{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="metrics-real-use">
      <div className="review-metrics-sectionHeading"><div><h2 id="metrics-real-use">Actual Guide use</h2><p>The live static-comparison summary is still rendered from committed benchmark results.</p></div><Link href="/guide/benchmarks#static-css-output-structure-and-production-build">Open /guide/benchmarks</Link></div>
      <div className="review-metrics-realUse"><StaticComparisonSummary /></div>
      <p className="review-metrics-optionNote">The candidate affects only the optional compact summary list. Guide tables and their surrounding caveats remain intact.</p>
    </section>
  </main>
}
