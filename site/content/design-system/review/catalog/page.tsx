import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'
import AppearanceControl from '../../components/AppearanceControl'

import DemoCatalog from '~/site/components/demo/DemoCatalog'
import DemoExample from '~/site/components/demo/DemoExample'
import './page.css'

export { metadata }

function groups(prefix: string) {
  return [{
    id: `${prefix}-flow`, title: 'Document flow', entries: [
      { id: `${prefix}-clear`, title: 'Clear a right float', label: 'clear:right', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/clear', children: <DemoExample page="clear" section="clearing-right-floats" /> },
      { id: `${prefix}-clear-both`, title: 'Clear both sides', label: 'clear:both', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/clear', children: <DemoExample page="clear" section="clearing-both-left-and-right-floats" /> }
    ]
  }]
}

const options = [
  {
    number: '01', note: 'The same native details gain clearer tap and focus areas, a distinct class marker, calmer open state and more comfortable preview inset.',
    preview: <DemoCatalog groups={groups('current-catalog')} />
  }
] as const

export default function Page() {
  return <main className="ds-component-page review-catalog-review">
    <ReviewNavigation />
    <h1>Demo catalog</h1>
    <p className="review-catalog-intro">The same native details gain clearer tap and focus areas, a distinct class marker, calmer open state and more comfortable preview inset.</p>

    <AppearanceControl label="Preview theme" />

    <section aria-labelledby="catalog-options">
      <h2 id="catalog-options">Navigation treatments</h2>

      <div className="review-catalog-options">
        {options.map(({ number, note, preview }) => <article className="review-catalog-option" key={number}>
          <div className="review-catalog-optionPreview">{preview}</div>
          <p className="review-catalog-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="catalog-real-use">
      <div className="review-catalog-sectionHeading">
        <div><h2 id="catalog-real-use">Actual Reference scene</h2><p>The catalog expands the same float-clearing lesson used in the published Reference.</p></div>
        <Link href="https://developer.mozilla.org/en-US/docs/Web/CSS/clear">Open https://developer.mozilla.org/en-US/docs/Web/CSS/clear</Link>
      </div>
      <div className="review-catalog-realGuide"><DemoExample page="clear" section="clearing-right-floats" /></div>
      <p className="review-catalog-optionNote">The disclosure and category links sit outside this specimen, so they do not become part of the float layout.</p>
    </section>
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
