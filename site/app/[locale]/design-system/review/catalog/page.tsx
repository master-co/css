import Link from 'next/link'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'

import DemoCatalog from '~/site/components/demo/DemoCatalog'
import DemoExample from '~/site/components/demo/DemoExample'
import './page.css'

export const metadata = {
  title: 'Demo catalog review',
  description: 'Current Demo catalog and practical examples.'
}

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
    number: '01', title: 'Current', detail: 'Sharper disclosure hierarchy',
    note: 'The same native details gain clearer tap and focus areas, a distinct class marker, calmer open state and more comfortable preview inset.',
    preview: <DemoCatalog groups={groups('current-catalog')} />
  }
] as const

export default function Page() {
  return <main className="review-catalog-review">
    <div className="review-catalog-kicker">Design system · Component review 30</div>
    <h1>Demo catalog</h1>
    <p className="review-catalog-intro">The same native details gain clearer tap and focus areas, a distinct class marker, calmer open state and more comfortable preview inset.</p>

    <label htmlFor="catalog-review-theme" className="review-catalog-themeControl"><span>Preview theme</span><span className="review-catalog-themeSelect">Light · Dark · System<ThemeSelect id="catalog-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="catalog-options">
      <h2 id="catalog-options">Navigation treatments</h2>

      <div className="review-catalog-options">
        {options.map(({ number, title, detail, note, preview }) => <article className="review-catalog-option" key={number}>
          <div className="review-catalog-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
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
  </main>
}
