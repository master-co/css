import Link from 'next/link'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import ExpandContent from '~/site/docs-shell/components/ExpandContent'
import { BenchmarkDataTable } from '~/site/components/benchmarks'
import BenchmarkScrollRegion from '~/site/components/benchmarks/BenchmarkScrollRegion'
import { StaticCSSBytesTable } from '~/site/app/[locale]/guide/benchmarks/components/StaticTailwindComparison'
import './page.css'

export const metadata = {
  title: 'Benchmark data table review',
  description: 'Compare the Guide expansion control, current native disclosure and a refined data-table candidate.'
}

function SampleTable() {
  return <div className="doc-table"><table>
    <thead><tr><th scope="col">Fixture</th><th scope="col">Variant</th><th scope="col">Raw CSS</th><th scope="col">Gzip</th><th scope="col">Brotli</th><th scope="col">Samples</th></tr></thead>
    <tbody>
      <tr><th scope="row">Documentation</th><td>Static</td><td>56.2 kB</td><td>6.8 kB</td><td>5.1 kB</td><td>10</td></tr>
      <tr><th scope="row">Documentation</th><td>Runtime</td><td>32.4 kB</td><td>4.9 kB</td><td>3.7 kB</td><td>10</td></tr>
      <tr><th scope="row">Dashboard</th><td>Static</td><td>104.8 kB</td><td>13.2 kB</td><td>9.4 kB</td><td>10</td></tr>
    </tbody>
  </table></div>
}

function PreviousDataTable() {
  return <details className="review-data-table-previousData">
    <summary>Recorded CSS output<span>Complete data · scroll for more columns</span></summary>
    <BenchmarkScrollRegion title="Recorded CSS output"><SampleTable /></BenchmarkScrollRegion>
  </details>
}

const options = [
  { number: '01', title: 'Original Guide', detail: 'Expand button below a table preview', preview: <ExpandContent><SampleTable /></ExpandContent>, note: 'The published benchmark page reveals more of a full table with its established Expand button. The original presentation remains in the Guide.' },
  { number: '02', title: 'Previous shared', detail: 'Native disclosure and scroll region', preview: <PreviousDataTable />, note: 'The previous shared component kept the complete server-rendered table behind a native summary and a keyboard-scrollable region.' },
  { number: '03', title: 'Adopted', detail: 'Refined disclosure heading', preview: <BenchmarkDataTable title="Recorded CSS output"><SampleTable /></BenchmarkDataTable>, note: 'The adopted shared style improves the title, reading hint, chevron, expanded boundary and focus while preserving the native disclosure and scroll behavior.' }
] as const

export default function Page() {
  return <main className="review-data-table-review">
    <div className="review-data-table-kicker">Design system · Component review 22</div>
    <h1>Benchmark data table</h1>
    <p className="review-data-table-intro">A complete measurement table needs a compact entrance and an obvious way to inspect every column. The Guide’s original expansion pattern remains visible alongside the newer native disclosure.</p>
    <div className="review-data-table-reviewNote" role="note">Adopted shared style: <code>BenchmarkDataTable</code> now uses the refined native disclosure. The published Guide keeps its original Expand control.</div>
    <label htmlFor="data-table-review-theme" className="review-data-table-themeControl"><span>Preview theme</span><span className="review-data-table-themeSelect">Light · Dark · System<ThemeSelect id="data-table-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="data-table-options">
      <h2 id="data-table-options">Disclosure treatments</h2>
      <p className="review-data-table-sectionCopy">Open each treatment with click or keyboard. At phone width, focus the table region and use arrow keys to inspect hidden columns.</p>
      <div className="review-data-table-options">{options.map(({ number, title, detail, preview, note }) => <article className="review-data-table-option" key={number}>
        <div className="review-data-table-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
        <div className="review-data-table-optionPreview">{preview}</div>
        <p className="review-data-table-optionNote">{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="data-table-real-use">
      <div className="review-data-table-sectionHeading"><div><h2 id="data-table-real-use">Actual Guide use</h2><p>The live static CSS table still uses its original expansion control and committed measurements.</p></div><Link href="/guide/benchmarks#static-css-output-structure-and-production-build">Open /guide/benchmarks</Link></div>
      <div className="review-data-table-realUse"><StaticCSSBytesTable /></div>
      <p className="review-data-table-optionNote">Only the shared Design System disclosure is being considered. The Guide’s table content and surrounding interpretation remain intact.</p>
    </section>
  </main>
}
