import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'
import InlineCode from '~/site/docs-shell/components/InlineCode'
import AppearanceControl from '../../components/AppearanceControl'
import ThemeNumberVariableTable from '~/site/components/ThemeNumberVariableTable'
import { getThemeNumericVariableEntries } from '~/site/utils/theme-variables'
import './page.css'

export { metadata }

const entries = getThemeNumericVariableEntries('spacing').slice(0, 5)

function SpacingTable() {
  // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- The overflowing table region needs keyboard focus for horizontal scrolling.
  return <figure><div className="doc-number-variable-table doc-table" data-representation="spacing" role="region" aria-label="Spacing token sample" tabIndex={0}>
    <table><thead><tr><th scope="col">Token</th><th scope="col">Value</th><th scope="col">PX</th><th scope="col">Representation</th></tr></thead>
      <tbody>{entries.map((entry) => <tr key={entry.key}>
        <th scope="row"><InlineCode>{`--spacing-${entry.key}`}</InlineCode></th>
        <td><InlineCode>{entry.value}</InlineCode></td>
        <td>{`${Number(entry.px.toFixed(4))}px`}</td>
          <td><div className="display:inline-flex width:fit-content outline-line-subtle outline-offset:-1px outline-style:solid outline-width:1px background:var(--stripe-pink) v:middle" style={{ gap: entry.value }}>
          {Array.from({ length: 5 }, (_, index) => <span key={index} className="display:inline-block height:1.5em width:1.5em bg-surface-raised" />)}
        </div></td>
      </tr>)}</tbody>
    </table>
  </div></figure>
}

const options = [
  { number: '01', className: 'review-numeric-table-currentPreview', preview: <SpacingTable />, note: "The current shared style restores the pink spacing specimen, gives value columns stable widths and a quieter row rhythm, and lets a narrow table scroll with keyboard focus." }
] as const

export default function Page() {
  return <main className="ds-component-page review-numeric-table-review">
    <ReviewNavigation />
    <h1>Numeric token table</h1>
    <p className="review-numeric-table-intro">The current shared style restores the pink spacing specimen, gives value columns stable widths and a quieter row rhythm, and lets a narrow table scroll with keyboard focus.</p>

    <AppearanceControl label="Preview theme" />

    <section aria-labelledby="numeric-options">
      <h2 id="numeric-options">Token treatments</h2>

      <div className="review-numeric-table-options">{options.map(({ number, className, preview, note }) => <article className="review-numeric-table-option" key={number}>
        <div className={`review-numeric-table-optionPreview ${className}`}>{preview}</div>
        <p className="review-numeric-table-optionNote">{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="numeric-real-use">
      <div className="review-numeric-table-sectionHeading"><div><h2 id="numeric-real-use">Actual Guide use</h2><p>The live Spacing Guide selects the values needed for its example from the shared preset.</p></div><Link href="/guide/spacing">Open /guide/spacing</Link></div>
      <div className="review-numeric-table-optionPreview"><ThemeNumberVariableTable namespace="spacing" representation="spacing" /></div>
      <p className="review-numeric-table-optionNote">The Guide’s pink layout demo below this table remains in place. The token values come from the active preset rather than these review samples.</p>
    </section>
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
