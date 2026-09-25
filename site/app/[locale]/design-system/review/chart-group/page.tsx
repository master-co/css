import Link from 'next/link'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import { BenchmarkBars, BenchmarkChartGroup, type BenchmarkBarItem } from '~/site/components/benchmarks'
import { StaticCSSOutputChart } from '~/site/app/[locale]/guide/benchmarks/components/StaticTailwindComparison'
import './page.css'

export const metadata = {
  title: 'Chart group review',
  description: 'Compare the established benchmark chart, current grouping and a refined heading treatment.'
}

const items: BenchmarkBarItem[] = [
  { id: 'a', label: 'Fixture A', value: 18.4, color: 'blue', detail: '10 samples' },
  { id: 'b', label: 'Fixture B', value: 28.6, color: 'violet', detail: '10 samples' },
  { id: 'c', label: 'Fixture C', value: 0, color: 'neutral', detail: 'no recorded output' }
]

function PreviousChartGroup() {
  return <div className="review-chart-group-previousGroup">
    <div className="review-chart-group-previousHeading"><h4>Compressed CSS</h4><span>Brotli · 10 samples</span></div>
    <BenchmarkBars items={items} unit="kB" />
  </div>
}

const options = [
  { number: '01', title: 'Original Guide', detail: 'Chart beneath the document heading', preview: <div className="review-chart-group-original"><h4>Compressed CSS</h4><BenchmarkBars items={items} unit="kB" /></div>, note: 'The original benchmark page gives the chart its context in the document heading and figure caption. The bars, values, and colors already work well.' },
  { number: '02', title: 'Previous shared', detail: 'Compact chart group heading', preview: <PreviousChartGroup />, note: 'The previous shared wrapper introduced a small in-chart title and a secondary detail across a fine rule.' },
  { number: '03', title: 'Adopted', detail: 'Clear metric hierarchy and context', preview: <BenchmarkChartGroup title="Compressed CSS" detail="Brotli · 10 samples" items={items} unit="kB" />, note: 'The adopted shared style strengthens the metric name, keeps unit and sample context in one quiet line, and adds breathing room above the unchanged bars.' }
] as const

export default function Page() {
  return <main className="review-chart-group-review">
    <div className="review-chart-group-kicker">Design system · Component review 20</div>
    <h1>Benchmark chart group</h1>
    <p className="review-chart-group-intro">A chart title should explain what the bars measure without competing with the data. The original Guide chart and its full figure caption remain useful; this review concerns the optional shared heading around a chart.</p>
    <div className="review-chart-group-reviewNote" role="note">Adopted shared style: <code>BenchmarkChartGroup</code> now uses the refined metric heading. The published Guide keeps its original chart and figure caption.</div>
    <label htmlFor="chart-review-theme" className="review-chart-group-themeControl"><span>Preview theme</span><span className="review-chart-group-themeSelect">Light · Dark · System<ThemeSelect id="chart-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="chart-options">
      <h2 id="chart-options">Chart treatments</h2>
      <p className="review-chart-group-sectionCopy">Each treatment uses the same illustrative data, including a zero value. The bars themselves are the existing Guide component.</p>
      <div className="review-chart-group-options">{options.map(({ number, title, detail, preview, note }) => <article className="review-chart-group-option" key={number}>
        <div className="review-chart-group-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
        <div className="review-chart-group-optionPreview">{preview}</div>
        <p className="review-chart-group-optionNote">{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="chart-real-use">
      <div className="review-chart-group-sectionHeading"><div><h2 id="chart-real-use">Actual Guide use</h2><p>The real `docs` fixture chart uses committed measurements and keeps its explanation in the document.</p></div><Link href="/guide/benchmarks#static-css-output-structure-and-production-build">Open /guide/benchmarks</Link></div>
      <div className="review-chart-group-realUse"><StaticCSSOutputChart /></div>
      <p className="review-chart-group-optionNote">This original chart is not converted into a group by the review. Its nearby figure caption, sources and limitations stay in the Guide.</p>
    </section>
  </main>
}
