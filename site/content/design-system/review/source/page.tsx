import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'
import AppearanceControl from '../../components/AppearanceControl'
import { BenchmarkSource } from '~/site/components/benchmarks'
import { benchmarkSnapshots } from '~/site/content/guide/benchmarks/components/BenchmarkSnapshots'
import './page.css'

export { metadata }

const source = benchmarkSnapshots['tailwind-static-comparison']

function GuideSourceRow() {
  // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Keep the complete source table scrollable by keyboard.
  return <div className="doc-table" role="region" aria-label="Benchmark source details" tabIndex={0}><table className="review-source-sourceTable">
    <thead><tr><th scope="col">Suite</th><th scope="col">Snapshot</th><th scope="col">Regenerate</th></tr></thead>
    <tbody><tr><th scope="row">Static CSS output, structure, and production build</th><td><a href="https://github.com/master-co/css/tree/rc/benchmarks/tailwind-static-comparison/snapshot.json">tailwind-static-comparison/snapshot.json</a></td><td><code>pnpm --filter ./benchmarks bench:css-output-size</code>, <code>pnpm --filter ./benchmarks bench:build-performance</code>, <code>pnpm --filter ./benchmarks bench:css-structure</code>, then <code>pnpm --filter ./benchmarks snapshot:tailwind-static-comparison</code></td></tr></tbody>
  </table></div>
}

const options = [
  { number: '01', preview: <BenchmarkSource {...source} />, note: "The current shared style makes provenance easier to spot with a quiet Evidence label, a stronger source link and a tabular date." }
] as const

export default function Page() {
  return <main className="ds-component-page review-source-review">
    <ReviewNavigation />
    <h1>Benchmark source</h1>
    <p className="review-source-intro">The current shared style makes provenance easier to spot with a quiet Evidence label, a stronger source link and a tabular date.</p>

    <AppearanceControl label="Preview theme" />

    <section aria-labelledby="source-options">
      <h2 id="source-options">Source treatments</h2>

      <div className="review-source-options">{options.map(({ number, preview, note }) => <article className="review-source-option" key={number}>
        <div className="review-source-optionPreview">{preview}</div>
        <p className="review-source-optionNote">{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="source-real-use">
      <div className="review-source-sectionHeading"><div><h2 id="source-real-use">Actual Guide source</h2><p>The published data-sources section lists this snapshot with its regeneration commands and the limits of the measurements.</p></div><Link href="/guide/benchmarks#data-sources">Open /guide/benchmarks</Link></div>
      <div className="review-source-realUse"><GuideSourceRow /></div>
      <p className="review-source-optionNote">The source footer does not replace the Guide’s full methodology or source table.</p>
    </section>
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
