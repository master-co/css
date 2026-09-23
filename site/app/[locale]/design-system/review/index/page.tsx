'use client'

import Link from 'next/link'
import { IconBook, IconLayoutGrid } from '@tabler/icons-react'
import DocumentationIndex, { type DocumentationIndexSection } from '~/site/components/DocumentationIndex'
import GuideIndex from '~/site/app/[locale]/guide/components/GuideIndex'
import categories from '~/site/.categories/guide.json'
import styles from './page.module.css'

function sectionsFor(prefix: string): DocumentationIndexSection[] {
  return [
    { id: `${prefix}-learning`, title: 'Learn', description: 'Start with one complete example, then build on it.', Icon: IconBook, groups: [{ entries: [
      { id: `${prefix}-intro`, title: 'Introduction', description: 'Write your first classes and choose a delivery mode.', category: 'Guide', url: '/guide/introduction' },
      { id: `${prefix}-tutorial`, title: 'Syntax tutorial', description: 'Build a button with states and conditions.', category: 'Guide', url: '/guide/syntax-tutorial' },
    ] }] },
    { id: `${prefix}-utilities`, title: 'Utilities', description: 'Look up a specific layout behavior.', Icon: IconLayoutGrid, groups: [
      { id: `${prefix}-flow`, title: 'Document flow', entries: [
        { id: `${prefix}-clear`, title: 'clear', category: 'Document flow', url: '/reference/clear' },
        { id: `${prefix}-display`, title: 'display', category: 'Document flow', url: '/reference/display' },
      ] },
      { id: `${prefix}-layout`, title: 'Layout', entries: [
        { id: `${prefix}-flex`, title: 'flex', category: 'Layout', url: '/reference/flex' },
        { id: `${prefix}-grid`, title: 'grid', category: 'Layout', url: '/reference/grid' },
      ] },
    ] }
  ]
}

const related = { href: '/reference', title: 'Full Reference', description: 'Browse utilities, tokens and tools.', Icon: IconBook }
const options = [
  {
    number: '01', title: 'Original', detail: 'Established card grid and categories',
    note: 'The original index already had strong top-level navigation, compact entry links and a native A–Z switch. It did not expose direct shortcuts to multi-group headings.',
    className: styles.original, prefix: 'original'
  },
  {
    number: '02', title: 'Current', detail: 'Group anchors added',
    note: 'The current component preserves the original visual system and adds stable group shortcuts for long Reference sections.',
    className: styles.current, prefix: 'current'
  },
  {
    number: '03', title: 'Candidate', detail: 'Refined type and link rhythm',
    note: 'The adopted styling keeps the same grid and native navigation, with clearer card hierarchy, calmer category links and larger mobile targets.',
    className: styles.candidate, prefix: 'candidate'
  }
] as const

export default function Page() {
  return <main className={styles.review}>
    <div className={styles.kicker}>Design system · Component review 16</div>
    <h1>Documentation index</h1>
    <p className={styles.intro}>The Guide and Reference catalog already give readers useful routes into a large set of pages. This review retains their card grid and A–Z switch, then considers a small refinement to type hierarchy and category spacing.</p>
    <div className={styles.reviewNote} role="note">Adopted styling: the published Guide and Reference indexes now use the candidate treatment. Each catalog below has independent anchors, so the By category and A–Z controls can be tested separately with keyboard or pointer.</div>

    <section aria-labelledby="index-options">
      <h2 id="index-options">Catalog treatments</h2>
      <p className={styles.sectionCopy}>All three variants use the same six destinations. The original omits the later group shortcut row; the current and candidate include it.</p>
      <div className={styles.options}>
        {options.map(({ number, title, detail, note, className, prefix }) => <article className={styles.option} key={number}>
          <div className={styles.optionHeading}><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className={className}><DocumentationIndex name="guide" idPrefix={prefix} sections={sectionsFor(prefix)} showDescriptions related={related} /></div>
          <p className={styles.optionNote}>{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="index-real-use">
      <div className={styles.sectionHeading}>
        <div><h2 id="index-real-use">Actual Guide use</h2><p>A live excerpt uses the Guide’s own index component and real Getting Started entries.</p></div>
        <Link href="/guide">Open /guide</Link>
      </div>
      <div className={styles.realUse}><GuideIndex pageCategories={categories.filter(category => category.name === 'Getting Started')} /></div>
      <p className={styles.optionNote}>The full Guide retains its original content and layout. The Reference uses the same shared index with compact utility links and stable anchors.</p>
    </section>
  </main>
}
