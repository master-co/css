import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'
import AppearanceControl from '../../components/AppearanceControl'

import { BenchmarkDataTable } from '~/site/components/benchmarks'

import { StaticCSSBytesTable } from '~/site/content/guide/benchmarks/components/StaticTailwindComparison'
import './page.css'

export { metadata }

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

const options = [
  { number: '01', preview: <BenchmarkDataTable title="Recorded CSS output"><SampleTable /></BenchmarkDataTable>, note: "The current shared style improves the title, reading hint, chevron, expanded boundary and focus while preserving the native disclosure and scroll behavior." }
] as const

export default function Page() {
  return <main className="ds-component-page review-data-table-review">
    <ReviewNavigation />
    <h1>Benchmark data table</h1>
    <p className="review-data-table-intro">The current shared style improves the title, reading hint, chevron, expanded boundary and focus while preserving the native disclosure and scroll behavior.</p>

    <AppearanceControl label="Preview theme" />

    <section aria-labelledby="data-table-options">
      <h2 id="data-table-options">Disclosure treatments</h2>

      <div className="review-data-table-options">{options.map(({ number, preview, note }) => <article className="review-data-table-option" key={number}>
        <div className="review-data-table-optionPreview">{preview}</div>
        <p className="review-data-table-optionNote">{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="data-table-real-use">
      <div className="review-data-table-sectionHeading"><div><h2 id="data-table-real-use">Actual Guide use</h2><p>The live static CSS table still uses its original expansion control and committed measurements.</p></div><Link href="/guide/benchmarks#static-css-output-structure-and-production-build">Open /guide/benchmarks</Link></div>
      <div className="review-data-table-realUse"><StaticCSSBytesTable /></div>
      <p className="review-data-table-optionNote">The complete measurements stay in the table; the native disclosure controls when they appear.</p>
    </section>
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
