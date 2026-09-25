import Link from 'next/link'
import InlineCode from '~/site/docs-shell/components/InlineCode'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import NamespaceUtilityTable, { type NamespaceUtilityGroup } from '~/site/components/NamespaceUtilityTable'
import { ColorNamespaceTable } from '~/site/app/[locale]/guide/colors/components/ColorNamespaces'
import './page.css'

export const metadata = {
  title: 'Utility table review',
  description: 'Compare the original and current utility table with a refined candidate in a real Guide context.'
}

const groups: NamespaceUtilityGroup[] = [
  { label: 'General paint', keys: ['bg', 'background-color', 'fg', 'color', 'accent-color', 'fill'], description: 'Use palette steps and hue aliases for broad paint decisions.' },
  { label: 'Surfaces', keys: ['surface'], description: 'Use surface roles for panels, cards, overlays, and inverse blocks.' },
  { label: 'Line roles', keys: ['b', 'bt', 'br', 'bb', 'bl', 'border-color', 'outline-color', 'stroke'], description: 'Use line roles for borders, dividers, outlines, and strokes.' }
]

function ThreeColumnTable() {
  return <figure><div className="doc-table"><table>
    <thead><tr><th scope="col">Group</th><th scope="col">Utility keys</th><th scope="col">Description</th></tr></thead>
    <tbody>{groups.map((group) => <tr key={group.label}>
      <th scope="row">{group.label}</th>
      <td>{group.keys.map((key, index) => <span key={key}><InlineCode>{key}</InlineCode>{index < group.keys.length - 1 && ', '}</span>)}</td>
      <td>{group.description}</td>
    </tr>)}</tbody>
  </table></div></figure>
}

function PreviousSharedTable() {
  return <figure><div className="doc-table"><table>
    <thead><tr><th scope="col">Group</th><th scope="col">Utility keys and purpose</th></tr></thead>
    <tbody>{groups.map((group) => <tr key={group.label}>
      <th scope="row" className="white-space:nowrap">{group.label}</th>
      <td><div>{group.keys.map((key, index) => <span key={key}><InlineCode className="white-space:nowrap">{key}</InlineCode>{index < group.keys.length - 1 && ', '}</span>)}</div><div className="mt-xs">{group.description}</div></td>
    </tr>)}</tbody>
  </table></div></figure>
}

const options = [
  { number: '01', title: 'Original Guide', detail: 'Three clear information columns', className: '', preview: <ThreeColumnTable />, note: 'The original table separates utility keys from their purpose. It uses the established Guide table lines and native table markup.' },
  { number: '02', title: 'Previous shared', detail: 'Two columns with merged purpose', className: '', preview: <PreviousSharedTable />, note: 'The previous shared version kept data-driven keys but placed descriptions beneath them to fit narrow reading columns.' },
  { number: '03', title: 'Adopted', detail: 'Refined three-column Guide table', className: 'review-utility-table-candidate', preview: <NamespaceUtilityTable groups={groups} />, note: 'The adopted shared component restores the original hierarchy, with measured column widths, restrained row rhythm and readable code wrapping. The table itself scrolls in a narrow column, including by keyboard.' }
] as const

export default function Page() {
  return <main className="review-utility-table-review">
    <div className="review-utility-table-kicker">Design system · Component review 18</div>
    <h1>Utility table</h1>
    <p className="review-utility-table-intro">The Guide’s namespace table tells readers which utility keys accept a token family. The original separated keys and their purpose; this candidate keeps that structure and gives each column clearer space at the documentation width.</p>
    <div className="review-utility-table-reviewNote" role="note">Adopted shared style: <code>NamespaceUtilityTable</code> now uses the refined three-column treatment. The published Guide keeps its existing content and page structure.</div>
    <label htmlFor="utility-review-theme" className="review-utility-table-themeControl"><span>Preview theme</span><span className="review-utility-table-themeSelect">Light · Dark · System<ThemeSelect id="utility-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="utility-options">
      <h2 id="utility-options">Table treatments</h2>
      <p className="review-utility-table-sectionCopy">The same three groups appear in each treatment. On a phone, scroll inside a three-column table to reach the description; the page itself remains fixed.</p>
      <div className="review-utility-table-options">{options.map(({ number, title, detail, className, preview, note }) => <article className="review-utility-table-option" key={number}>
        <div className="review-utility-table-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
        <div className={`review-utility-table-optionPreview ${className}`}>{preview}</div>
        <p className="review-utility-table-optionNote">{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="utility-real-use">
      <div className="review-utility-table-sectionHeading"><div><h2 id="utility-real-use">Actual Guide use</h2><p>The live color namespace groups use manifest-filtered keys in the adopted shared component.</p></div><Link href="/guide/colors#namespaces-for-color">Open /guide/colors</Link></div>
      <div className="review-utility-table-optionPreview"><ColorNamespaceTable /></div>
      <p className="review-utility-table-optionNote">Only the table presentation is being considered. The Guide’s surrounding explanation and token palette remain intact.</p>
    </section>
  </main>
}
