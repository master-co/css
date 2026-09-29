import Link from 'next/link'

import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import NamespaceUtilityTable, { type NamespaceUtilityGroup } from '~/site/components/NamespaceUtilityTable'
import { DocumentNamespaceTable } from '~/site/components/DocumentValues'
import { variableNamespaceSources } from '~/site/utils/variable-namespace-sources'
import './page.css'

export const metadata = {
  title: 'Utility table review',
  description: 'Current Utility table and practical examples.'
}

const groups: NamespaceUtilityGroup[] = [
  { label: 'General paint', keys: ['bg', 'background-color', 'fg', 'color', 'accent-color', 'fill'], description: 'Use palette steps and hue aliases for broad paint decisions.' },
  { label: 'Surfaces', keys: ['surface'], description: 'Use surface roles for panels, cards, overlays, and inverse blocks.' },
  { label: 'Line roles', keys: ['b', 'bt', 'br', 'bb', 'bl', 'border-color', 'outline-color', 'stroke'], description: 'Use line roles for borders, dividers, outlines, and strokes.' }
]

const options = [
  { number: '01', title: 'Current', detail: 'Refined three-column Guide table', className: 'review-utility-table-currentPreview', preview: <NamespaceUtilityTable groups={groups} />, note: "The current shared component restores the original hierarchy, with measured column widths, restrained row rhythm and readable code wrapping. The table itself scrolls in a narrow column, including by keyboard." }
] as const

export default function Page() {
  return <main className="review-utility-table-review">
    <div className="review-utility-table-kicker">Design system · Component review 18</div>
    <h1>Utility table</h1>
    <p className="review-utility-table-intro">The current shared component restores the original hierarchy, with measured column widths, restrained row rhythm and readable code wrapping. The table itself scrolls in a narrow column, including by keyboard.</p>

    <label htmlFor="utility-review-theme" className="review-utility-table-themeControl"><span>Preview theme</span><span className="review-utility-table-themeSelect">Light · Dark · System<ThemeSelect id="utility-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="utility-options">
      <h2 id="utility-options">Table treatments</h2>

      <div className="review-utility-table-options">{options.map(({ number, title, detail, className, preview, note }) => <article className="review-utility-table-option" key={number}>
        <div className="review-utility-table-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
        <div className={`review-utility-table-optionPreview ${className}`}>{preview}</div>
        <p className="review-utility-table-optionNote">{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="utility-real-use">
      <div className="review-utility-table-sectionHeading"><div><h2 id="utility-real-use">Actual Guide use</h2><p>The live color namespace groups use manifest-filtered keys in the current shared component.</p></div><Link href="/guide/colors#namespaces-for-color">Open /guide/colors</Link></div>
      <div className="review-utility-table-optionPreview"><DocumentNamespaceTable rows={variableNamespaceSources.filter(row => row.namespace === 'color')} /></div>
      <p className="review-utility-table-optionNote">Only the table presentation is being considered. The Guide’s surrounding explanation and token palette remain intact.</p>
    </section>
  </main>
}
