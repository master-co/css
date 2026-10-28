import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'
import AppearanceControl from '../../components/AppearanceControl'
import { BenchmarkBars, BenchmarkChartGroup, type BenchmarkBarItem } from '~/site/components/benchmarks'
import { StaticCSSOutputChart } from '~/site/content/guide/benchmarks/components/StaticTailwindComparison'
import './page.css'

export { metadata }

const items: BenchmarkBarItem[] = [
  { id: 'a', label: 'Fixture A', value: 18.4, color: 'blue', detail: '10 samples' },
  { id: 'b', label: 'Fixture B', value: 28.6, color: 'violet', detail: '10 samples' },
  { id: 'c', label: 'Fixture C', value: 0, color: 'neutral', detail: 'no recorded output' }
]

const options = [
  { number: '01', preview: <BenchmarkChartGroup title="Compressed CSS" detail="Brotli · 10 samples" items={items} unit="kB" />, note: "The current shared style strengthens the metric name, keeps unit and sample context in one quiet line, and adds breathing room above the unchanged bars." }
] as const

export default function Page() {
  return <main className="ds-component-page review-chart-group-review">
    <ReviewNavigation />
    <h1>Benchmark chart group</h1>
    <p className="review-chart-group-intro">The current shared style strengthens the metric name, keeps unit and sample context in one quiet line, and adds breathing room above the unchanged bars.</p>

    <AppearanceControl label="Preview theme" />

    <section aria-labelledby="chart-options">
      <h2 id="chart-options">Chart treatments</h2>

      <div className="review-chart-group-options">{options.map(({ number, preview, note }) => <article className="review-chart-group-option" key={number}>
        <div className="review-chart-group-optionPreview">{preview}</div>
        <p className="review-chart-group-optionNote">{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="chart-real-use">
      <div className="review-chart-group-sectionHeading"><div><h2 id="chart-real-use">Actual Guide use</h2><p>The real `docs` fixture chart uses committed measurements and keeps its explanation in the document.</p></div><Link href="/guide/benchmarks#static-css-output-structure-and-production-build">Open /guide/benchmarks</Link></div>
      <div className="review-chart-group-realUse"><StaticCSSOutputChart /></div>
      <p className="review-chart-group-optionNote">This original chart is not converted into a group by the review. Its nearby figure caption, sources and limitations stay in the Guide.</p>
    </section>
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
