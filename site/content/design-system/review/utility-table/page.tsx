import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'

import AppearanceControl from '../../components/AppearanceControl'
import NamespaceUtilityTable, { type NamespaceUtilityGroup } from '~/site/components/NamespaceUtilityTable'
import { DocumentNamespaceTable } from '~/site/components/DocumentValues'
import { variableNamespaceSources } from '~/site/utils/variable-namespace-sources'
import './page.css'

export { metadata }

const groups: NamespaceUtilityGroup[] = [
  { label: 'General paint', keys: ['bg', 'background-color', 'fg', 'color', 'accent-color', 'fill'], description: 'Use palette steps and hue aliases for broad paint decisions.' },
  { label: 'Surfaces', keys: ['surface'], description: 'Use surface roles for panels, cards, overlays, and inverse blocks.' },
  { label: 'Line roles', keys: ['b', 'bt', 'br', 'bb', 'bl', 'border-color', 'outline-color', 'stroke'], description: 'Use line roles for borders, dividers, outlines, and strokes.' }
]

const options = [
  { number: '01', className: 'review-utility-table-currentPreview', preview: <NamespaceUtilityTable groups={groups} />, note: "The current shared component restores the original hierarchy, with measured column widths, restrained row rhythm and readable code wrapping. The table itself scrolls in a narrow column, including by keyboard." }
] as const

export default function Page() {
  return <main className="ds-component-page review-utility-table-review">
    <ReviewNavigation />
    <h1>Utility table</h1>
    <p className="review-utility-table-intro">The current shared component restores the original hierarchy, with measured column widths, restrained row rhythm and readable code wrapping. The table itself scrolls in a narrow column, including by keyboard.</p>

    <AppearanceControl label="Preview theme" />

    <section aria-labelledby="utility-options">
      <h2 id="utility-options">Table treatments</h2>

      <div className="review-utility-table-options">{options.map(({ number, className, preview, note }) => <article className="review-utility-table-option" key={number}>
        <div className={`review-utility-table-optionPreview ${className}`}>{preview}</div>
        <p className="review-utility-table-optionNote">{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="utility-real-use">
      <div className="review-utility-table-sectionHeading"><div><h2 id="utility-real-use">Actual Guide use</h2><p>The live color namespace groups use manifest-filtered keys in the current shared component.</p></div><Link href="/guide/colors#namespaces-for-color">Open /guide/colors</Link></div>
      <div className="review-utility-table-optionPreview"><DocumentNamespaceTable rows={variableNamespaceSources.filter(row => row.namespace === 'color')} /></div>
      <p className="review-utility-table-optionNote">The table and its source values remain beside the Guide’s explanation and complete palette.</p>
    </section>
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
