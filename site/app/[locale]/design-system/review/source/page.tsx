import Link from 'next/link'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import { BenchmarkSource } from '~/site/components/benchmarks'
import { benchmarkSnapshots } from '~/site/app/[locale]/guide/benchmarks/components/BenchmarkSnapshots'
import './page.css'

export const metadata = {
  title: 'Benchmark source review',
  description: 'Current Benchmark source and practical examples.'
}

const source = benchmarkSnapshots['tailwind-static-comparison']

function GuideSourceRow() {
  return <div className="doc-table"><table className="review-source-sourceTable">
    <thead><tr><th scope="col">Suite</th><th scope="col">Snapshot</th><th scope="col">Regenerate</th></tr></thead>
    <tbody><tr><th scope="row">Static CSS output, structure, and production build</th><td><a href="https://github.com/master-co/css/tree/rc/benchmarks/tailwind-static-comparison/snapshot.json">tailwind-static-comparison/snapshot.json</a></td><td><code>pnpm --filter ./benchmarks bench:css-output-size</code>, <code>pnpm --filter ./benchmarks bench:build-performance</code>, <code>pnpm --filter ./benchmarks bench:css-structure</code>, then <code>pnpm --filter ./benchmarks snapshot:tailwind-static-comparison</code></td></tr></tbody>
  </table></div>
}

const options = [
  { number: '01', title: 'Current', detail: 'Refined evidence footer', preview: <BenchmarkSource {...source} />, note: "The current shared style makes provenance easier to spot with a quiet Evidence label, a stronger source link and a tabular date." }
] as const

export default function Page() {
  return <main className="review-source-review">
    <div className="review-source-kicker">Design system · Component review 23</div>
    <h1>Benchmark source</h1>
    <p className="review-source-intro">The current shared style makes provenance easier to spot with a quiet Evidence label, a stronger source link and a tabular date.</p>

    <label htmlFor="source-review-theme" className="review-source-themeControl"><span>Preview theme</span><span className="review-source-themeSelect">Light · Dark · System<ThemeSelect id="source-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="source-options">
      <h2 id="source-options">Source treatments</h2>

      <div className="review-source-options">{options.map(({ number, title, detail, preview, note }) => <article className="review-source-option" key={number}>
        <div className="review-source-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
        <div className="review-source-optionPreview">{preview}</div>
        <p className="review-source-optionNote">{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="source-real-use">
      <div className="review-source-sectionHeading"><div><h2 id="source-real-use">Actual Guide source</h2><p>The published data-sources section lists this snapshot with its regeneration commands and the limits of the measurements.</p></div><Link href="/guide/benchmarks#data-sources">Open /guide/benchmarks</Link></div>
      <div className="review-source-realUse"><GuideSourceRow /></div>
      <p className="review-source-optionNote">The source footer does not replace the Guide’s full methodology or source table.</p>
    </section>
  </main>
}
