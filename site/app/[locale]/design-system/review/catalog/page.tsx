import Link from 'next/link'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import GuideIndex from '~/site/app/[locale]/guide/components/GuideIndex'
import categories from '~/site/.categories/guide.json'
import DemoCatalog from '~/site/components/demo/DemoCatalog'
import DemoExample from '~/site/components/demo/DemoExample'
import styles from './page.module.css'

export const metadata = {
  title: 'Demo catalog review',
  description: 'Original Guide navigation, the current recipe disclosure and a refined candidate.'
}

function groups(prefix: string) {
  return [{
    id: `${prefix}-flow`, title: 'Document flow', entries: [
      { id: `${prefix}-clear`, title: 'Clear a right float', label: 'clear:right', href: '/reference/clear#clearing-right-floats', children: <DemoExample page="clear" section="clearing-right-floats" /> },
      { id: `${prefix}-clear-both`, title: 'Clear both sides', label: 'clear:both', href: '/reference/clear#clearing-both-left-and-right-floats', children: <DemoExample page="clear" section="clearing-both-left-and-right-floats" /> }
    ]
  }]
}

const options = [
  {
    number: '01', title: 'Original Guide', detail: 'Established category navigation',
    note: 'The Guide presents paths into its lessons through a compact card grid. It keeps that existing navigation and does not need recipe disclosures.',
    preview: <div className={styles.original}><GuideIndex pageCategories={categories.filter(category => category.name === 'Getting Started')} /></div>
  },
  {
    number: '02', title: 'Current', detail: 'Shared recipe catalog',
    note: 'A categorized index leads to native disclosure rows. Each row keeps its Reference preview in server-rendered HTML and links to the complete lesson.',
    preview: <div className={styles.previous}><DemoCatalog groups={groups('current-catalog')} /></div>
  },
  {
    number: '03', title: 'Adopted', detail: 'Sharper disclosure hierarchy',
    note: 'The same native details gain clearer tap and focus areas, a distinct class marker, calmer open state and more comfortable preview inset.',
    preview: <DemoCatalog groups={groups('candidate-catalog')} />
  }
] as const

export default function Page() {
  return <main className={styles.review}>
    <div className={styles.kicker}>Design system · Component review 30</div>
    <h1>Demo catalog</h1>
    <p className={styles.intro}>The Guide already has a clear lesson index. The shared catalog is for browsing many independent Reference specimens inside the Design System. This review refines that disclosure without changing the Guide index or the Reference lesson pages.</p>
    <div className={styles.reviewNote} role="note">The refined shared recipe disclosure is adopted. The original Guide index and Reference lessons remain in place.</div>
    <label htmlFor="catalog-review-theme" className={styles.themeControl}><span>Preview theme</span><span className={styles.themeSelect}>Light · Dark · System<ThemeSelect id="catalog-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="catalog-options">
      <h2 id="catalog-options">Navigation treatments</h2>
      <p className={styles.sectionCopy}>Open the clear examples by pointer, Enter or Space. Both shared variants use real Reference scenes; their class labels and destination links are identical.</p>
      <div className={styles.options}>
        {options.map(({ number, title, detail, note, preview }) => <article className={styles.option} key={number}>
          <div className={styles.optionHeading}><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className={styles.optionPreview}>{preview}</div>
          <p className={styles.optionNote}>{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="catalog-real-use">
      <div className={styles.sectionHeading}>
        <div><h2 id="catalog-real-use">Actual Reference scene</h2><p>The catalog expands the same float-clearing lesson used in the published Reference.</p></div>
        <Link href="/reference/clear#clearing-right-floats">Open /reference/clear</Link>
      </div>
      <div className={styles.realGuide}><DemoExample page="clear" section="clearing-right-floats" /></div>
      <p className={styles.optionNote}>The disclosure and category links sit outside this specimen, so they do not become part of the float layout.</p>
    </section>
  </main>
}
