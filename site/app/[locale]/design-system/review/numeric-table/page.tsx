import Link from 'next/link'
import InlineCode from '~/site/docs-shell/components/InlineCode'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import ThemeNumberVariableTable from '~/site/components/ThemeNumberVariableTable'
import { getThemeNumericVariableEntries } from '~/site/utils/theme-variables'
import styles from './page.module.css'

export const metadata = {
  title: 'Numeric token table review',
  description: 'Compare the original pink spacing specimen with the current and refined numeric token table.'
}

const entries = getThemeNumericVariableEntries('spacing').slice(0, 5)

function SpacingTable({ variant }: { variant: 'original' | 'current' | 'candidate' }) {
  const scrollable = variant === 'candidate'
  const pink = variant !== 'current'
  return <figure><div className={`doc-table ${scrollable ? 'doc-number-variable-table' : ''}`} data-representation={scrollable ? 'spacing' : undefined} role={scrollable ? 'region' : undefined} aria-label={scrollable ? 'Spacing token sample' : undefined} tabIndex={scrollable ? 0 : undefined}>
    <table><thead><tr><th scope="col">Token</th><th scope="col">Value</th><th scope="col">PX</th><th scope="col">Representation</th></tr></thead>
      <tbody>{entries.map((entry) => <tr key={entry.key}>
        <th scope="row"><InlineCode>{`--spacing-${entry.key}`}</InlineCode></th>
        <td><InlineCode>{entry.value}</InlineCode></td>
        <td>{`${Number(entry.px.toFixed(4))}px`}</td>
        <td><div className={`inline-flex w:fit-content outline:1px|solid|var(--color-line-muted) outline-offset:-1px v:middle ${pink ? 'background-color:var(--stripe-pink)' : 'demo-pattern'}`} style={{ gap: entry.value }}>
          {Array.from({ length: 5 }, (_, index) => <span key={index} className={`inline-block size:1.5em ${pink ? 'surface-raised' : 'demo-item'}`} />)}
        </div></td>
      </tr>)}</tbody>
    </table>
  </div></figure>
}

const options = [
  { number: '01', title: 'Original Guide', detail: 'Pink spacing specimen', className: styles.original, preview: <SpacingTable variant="original" />, note: 'The original uses the pink diagonal field and raised blocks to make each gap visible. The table keeps the established Guide typography.' },
  { number: '02', title: 'Current', detail: 'Neutral demo pattern', className: styles.current, preview: <SpacingTable variant="current" />, note: 'The shared table changed the gap specimen to a neutral stripe and demo blocks. Numeric values and column order stayed the same.' },
  { number: '03', title: 'Adopted', detail: 'Refined pink scale table', className: styles.candidate, preview: <SpacingTable variant="candidate" />, note: 'The adopted shared style restores the pink spacing specimen, gives value columns stable widths and a quieter row rhythm, and lets a narrow table scroll with keyboard focus.' }
] as const

export default function Page() {
  return <main className={styles.review}>
    <div className={styles.kicker}>Design system · Component review 19</div>
    <h1>Numeric token table</h1>
    <p className={styles.intro}>The Spacing Guide already uses a useful pink field to reveal gaps. The numeric table should preserve that visual language while keeping token values, pixel equivalents and descriptions easy to scan.</p>
    <div className={styles.reviewNote} role="note">Adopted shared style: <code>ThemeNumberVariableTable</code> uses the refined pink specimen for spacing. The published Guide keeps its surrounding content and layout.</div>
    <label htmlFor="numeric-review-theme" className={styles.themeControl}><span>Preview theme</span><span className={styles.themeSelect}>Light · Dark · System<ThemeSelect id="numeric-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="numeric-options">
      <h2 id="numeric-options">Token treatments</h2>
      <p className={styles.sectionCopy}>The same five manifest spacing tokens appear in each treatment. Their actual values set the gaps in the specimens.</p>
      <div className={styles.options}>{options.map(({ number, title, detail, className, preview, note }) => <article className={styles.option} key={number}>
        <div className={styles.optionHeading}><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
        <div className={`${styles.optionPreview} ${className}`}>{preview}</div>
        <p className={styles.optionNote}>{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="numeric-real-use">
      <div className={styles.sectionHeading}><div><h2 id="numeric-real-use">Actual Guide use</h2><p>The live Spacing Guide reads the complete scale from the preset with the adopted treatment.</p></div><Link href="/guide/spacing">Open /guide/spacing</Link></div>
      <div className={`${styles.optionPreview} ${styles.realUse}`}><ThemeNumberVariableTable namespace="spacing" representation="spacing" /></div>
      <p className={styles.optionNote}>The Guide’s pink layout demo below this table remains in place. The token values come from the active preset rather than these review samples.</p>
    </section>
  </main>
}
