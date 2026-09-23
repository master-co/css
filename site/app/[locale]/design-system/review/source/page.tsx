import Link from 'next/link'
import ThemeSelect from '~/internal/components/ThemeSelect'
import { BenchmarkSource } from '~/site/components/benchmarks'
import { benchmarkSnapshots } from '~/site/app/[locale]/guide/benchmarks/components/BenchmarkSnapshots'
import styles from './page.module.css'

export const metadata = {
  title: 'Benchmark source review',
  description: 'Compare the Guide data-source row, current source line and a refined evidence footer.'
}

const source = benchmarkSnapshots['tailwind-static-comparison']

function OriginalSourceRow() {
  return <div className="doc-table"><table className={styles.sourceTable}>
    <thead><tr><th scope="col">Suite</th><th scope="col">Snapshot</th><th scope="col">Regenerate</th></tr></thead>
    <tbody><tr><th scope="row">Static CSS output, structure, and production build</th><td><a href="https://github.com/master-co/css/tree/rc/benchmarks/tailwind-static-comparison/snapshot.json">tailwind-static-comparison/snapshot.json</a></td><td><code>pnpm --filter ./benchmarks bench:css-output-size</code>, <code>pnpm --filter ./benchmarks bench:build-performance</code>, <code>pnpm --filter ./benchmarks bench:css-structure</code>, then <code>pnpm --filter ./benchmarks snapshot:tailwind-static-comparison</code></td></tr></tbody>
  </table></div>
}

function PreviousSource() {
  return <p className={styles.previousSource}>
    <span>Recorded <time dateTime={source.generatedAt}>{source.generatedAt.slice(0, 10)} UTC</time></span>
    <a href={source.href}>Committed snapshot</a>
  </p>
}

const options = [
  { number: '01', title: 'Original Guide', detail: 'Full data-sources table', preview: <OriginalSourceRow />, note: 'The Guide lists the suite, committed snapshot and command in a complete source inventory. That table remains the authoritative reference.' },
  { number: '02', title: 'Previous shared', detail: 'Compact source line', preview: <PreviousSource />, note: 'The previous component paired a recorded date and source link, suitable for a nearby chart caption or data panel.' },
  { number: '03', title: 'Adopted', detail: 'Refined evidence footer', preview: <BenchmarkSource {...source} />, note: 'The adopted shared style makes provenance easier to spot with a quiet Evidence label, a stronger source link and a tabular date.' }
] as const

export default function Page() {
  return <main className={styles.review}>
    <div className={styles.kicker}>Design system · Component review 23</div>
    <h1>Benchmark source</h1>
    <p className={styles.intro}>A chart’s provenance should be easy to find without taking over the measured result. This optional source line complements the Guide’s complete data-source table.</p>
    <div className={styles.reviewNote} role="note">Adopted shared style: <code>BenchmarkSource</code> now uses the refined evidence footer. The published Guide keeps its complete source table.</div>
    <label htmlFor="source-review-theme" className={styles.themeControl}><span>Preview theme</span><span className={styles.themeSelect}>Light · Dark · System<ThemeSelect id="source-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="source-options">
      <h2 id="source-options">Source treatments</h2>
      <p className={styles.sectionCopy}>Each version points to the same committed benchmark snapshot. The date comes from its actual JSON metadata.</p>
      <div className={styles.options}>{options.map(({ number, title, detail, preview, note }) => <article className={styles.option} key={number}>
        <div className={styles.optionHeading}><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
        <div className={styles.optionPreview}>{preview}</div>
        <p className={styles.optionNote}>{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="source-real-use">
      <div className={styles.sectionHeading}><div><h2 id="source-real-use">Actual Guide source</h2><p>The published data-sources section lists this snapshot with its regeneration commands and the limits of the measurements.</p></div><Link href="/guide/benchmarks#data-sources">Open /guide/benchmarks</Link></div>
      <div className={styles.realUse}><OriginalSourceRow /></div>
      <p className={styles.optionNote}>The source footer does not replace the Guide’s full methodology or source table.</p>
    </section>
  </main>
}
