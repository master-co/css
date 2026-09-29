import Link from 'next/link'
import InlineCode from '~/site/docs-shell/components/InlineCode'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import ThemeNumberVariableTable from '~/site/components/ThemeNumberVariableTable'
import { getThemeNumericVariableEntries } from '~/site/utils/theme-variables'
import './page.css'

export const metadata = {
  title: 'Numeric token table review',
  description: 'Current Numeric token table and practical examples.'
}

const entries = getThemeNumericVariableEntries('spacing').slice(0, 5)

function SpacingTable() {
  // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- The overflowing table region needs keyboard focus for horizontal scrolling.
  return <figure><div className="doc-table doc-number-variable-table" data-representation="spacing" role="region" aria-label="Spacing token sample" tabIndex={0}>
    <table><thead><tr><th scope="col">Token</th><th scope="col">Value</th><th scope="col">PX</th><th scope="col">Representation</th></tr></thead>
      <tbody>{entries.map((entry) => <tr key={entry.key}>
        <th scope="row"><InlineCode>{`--spacing-${entry.key}`}</InlineCode></th>
        <td><InlineCode>{entry.value}</InlineCode></td>
        <td>{`${Number(entry.px.toFixed(4))}px`}</td>
        <td><div className="display:inline-flex width:fit-content outline-width:1px outline-style:solid outline-line-subtle outline-offset:-1px v:middle background-color:var(--stripe-pink)" style={{ gap: entry.value }}>
          {Array.from({ length: 5 }, (_, index) => <span key={index} className="display:inline-block width:1.5em height:1.5em bg-surface-raised" />)}
        </div></td>
      </tr>)}</tbody>
    </table>
  </div></figure>
}

const options = [
  { number: '01', title: 'Current', detail: 'Refined pink scale table', className: 'review-numeric-table-currentPreview', preview: <SpacingTable />, note: "The current shared style restores the pink spacing specimen, gives value columns stable widths and a quieter row rhythm, and lets a narrow table scroll with keyboard focus." }
] as const

export default function Page() {
  return <main className="review-numeric-table-review">
    <div className="review-numeric-table-kicker">Design system · Component review 19</div>
    <h1>Numeric token table</h1>
    <p className="review-numeric-table-intro">The current shared style restores the pink spacing specimen, gives value columns stable widths and a quieter row rhythm, and lets a narrow table scroll with keyboard focus.</p>

    <label htmlFor="numeric-review-theme" className="review-numeric-table-themeControl"><span>Preview theme</span><span className="review-numeric-table-themeSelect">Light · Dark · System<ThemeSelect id="numeric-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="numeric-options">
      <h2 id="numeric-options">Token treatments</h2>

      <div className="review-numeric-table-options">{options.map(({ number, title, detail, className, preview, note }) => <article className="review-numeric-table-option" key={number}>
        <div className="review-numeric-table-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
        <div className={`review-numeric-table-optionPreview ${className}`}>{preview}</div>
        <p className="review-numeric-table-optionNote">{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="numeric-real-use">
      <div className="review-numeric-table-sectionHeading"><div><h2 id="numeric-real-use">Actual Guide use</h2><p>The live Spacing Guide selects the values needed for its example from the shared preset.</p></div><Link href="/guide/spacing">Open /guide/spacing</Link></div>
      <div className="review-numeric-table-optionPreview"><ThemeNumberVariableTable namespace="spacing" representation="spacing" /></div>
      <p className="review-numeric-table-optionNote">The Guide’s pink layout demo below this table remains in place. The token values come from the active preset rather than these review samples.</p>
    </section>
  </main>
}
