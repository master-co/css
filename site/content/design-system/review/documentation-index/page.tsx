import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
export { metadata }

import Link from '~/site/docs-shell/components/Link'
import IndexReviewScene from './IndexReviewScene'
import GuideIndex from '~/site/content/guide/components/GuideIndex'
import categories from '~/site/.categories/guide.json'
import './page.css'

const options = [
  {
    number: '01', note: "The current styling keeps the same grid and native navigation, with clearer card hierarchy, calmer category links and larger mobile targets.",
    className: 'review-documentation-index-currentPreview', prefix: 'current'
  }
] as const

export default function Page() {
  return <main className="ds-component-page review-documentation-index-review">
    <ReviewNavigation />
    <h1>Documentation index</h1>
    <p className="review-documentation-index-intro">The current styling keeps the same grid and native navigation, with clearer card hierarchy, calmer category links and larger mobile targets.</p>

    <section aria-labelledby="index-options">
      <h2 id="index-options">Catalog treatments</h2>

      <div className="review-documentation-index-options">
        {options.map(({ number, note, className, prefix }) => <article className="review-documentation-index-option" key={number}>
          <div className={className}><IndexReviewScene prefix={prefix} /></div>
          <p className="review-documentation-index-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="index-real-use">
      <div className="review-documentation-index-sectionHeading">
        <div><h2 id="index-real-use">Actual Guide use</h2><p>A live excerpt uses the Guide’s own index component and real Getting Started entries.</p></div>
        <Link href="/guide">Open /guide</Link>
      </div>
      <div className="review-documentation-index-realUse"><GuideIndex pageCategories={categories.filter(category => category.name === 'Getting Started')} /></div>
      <p className="review-documentation-index-optionNote">The full Guide retains its original content and layout. The Reference uses the same shared index with compact utility links and stable anchors.</p>
    </section>
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
