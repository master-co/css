'use client'

import Link from 'next/link'
import { IconBook, IconLayoutGrid } from '@tabler/icons-react'
import DocumentationIndex, { type DocumentationIndexSection } from '~/site/components/DocumentationIndex'
import GuideIndex from '~/site/app/[locale]/guide/components/GuideIndex'
import categories from '~/site/.categories/guide.json'
import './page.css'

function sectionsFor(prefix: string): DocumentationIndexSection[] {
  return [
    { id: `${prefix}-learning`, title: 'Learn', description: 'Start with one complete example, then build on it.', Icon: IconBook, groups: [{ entries: [
      { id: `${prefix}-intro`, title: 'Introduction', description: 'Write your first classes and choose a delivery mode.', category: 'Guide', url: '/guide/introduction' },
      { id: `${prefix}-tutorial`, title: 'Syntax tutorial', description: 'Build a button with states and conditions.', category: 'Guide', url: '/guide/syntax-tutorial' },
    ] }] },
    { id: `${prefix}-utilities`, title: 'Utilities', description: 'Look up a specific layout behavior.', Icon: IconLayoutGrid, groups: [
      { id: `${prefix}-flow`, title: 'Document flow', entries: [
        { id: `${prefix}-clear`, title: 'clear', category: 'Document flow', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/clear' },
        { id: `${prefix}-display`, title: 'display', category: 'Document flow', url: '/guide/layout-system#choose-css-grid-or-flexbox' },
      ] },
      { id: `${prefix}-layout`, title: 'Layout', entries: [
        { id: `${prefix}-flex`, title: 'flex', category: 'Layout', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/flex-grow' },
        { id: `${prefix}-grid`, title: 'grid', category: 'Layout', url: '/guide/layout-system#add-explicit-tracks-only-when-needed' },
      ] },
    ] }
  ]
}

const related = { href: '/reference', title: 'Full Reference', description: 'Browse utilities, tokens and tools.', Icon: IconBook }
const options = [
  {
    number: '01', title: 'Current', detail: 'Refined type and link rhythm',
    note: "The current styling keeps the same grid and native navigation, with clearer card hierarchy, calmer category links and larger mobile targets.",
    className: 'review-index-currentPreview', prefix: 'current'
  }
] as const

export default function Page() {
  return <main className="review-index-review">
    <div className="review-index-kicker">Design system · Component review 16</div>
    <h1>Documentation index</h1>
    <p className="review-index-intro">The current styling keeps the same grid and native navigation, with clearer card hierarchy, calmer category links and larger mobile targets.</p>

    <section aria-labelledby="index-options">
      <h2 id="index-options">Catalog treatments</h2>

      <div className="review-index-options">
        {options.map(({ number, title, detail, note, className, prefix }) => <article className="review-index-option" key={number}>
          <div className="review-index-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className={className}><DocumentationIndex name="guide" idPrefix={prefix} sections={sectionsFor(prefix)} showDescriptions related={related} /></div>
          <p className="review-index-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="index-real-use">
      <div className="review-index-sectionHeading">
        <div><h2 id="index-real-use">Actual Guide use</h2><p>A live excerpt uses the Guide’s own index component and real Getting Started entries.</p></div>
        <Link href="/guide">Open /guide</Link>
      </div>
      <div className="review-index-realUse"><GuideIndex pageCategories={categories.filter(category => category.name === 'Getting Started')} /></div>
      <p className="review-index-optionNote">The full Guide retains its original content and layout. The Reference uses the same shared index with compact utility links and stable anchors.</p>
    </section>
  </main>
}
