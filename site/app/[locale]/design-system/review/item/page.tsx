import Link from 'next/link'
import OriginalDemo from '~/site/docs-shell/components/Demo'
import Demo from '~/site/components/demo/Demo'
import { DemoItem } from '~/site/components/demo'
import './page.css'

export const metadata = {
  title: 'Demo item review',
  description: 'Review-only comparison of the original, current and proposed demo object.'
}

function specimen(kind: 'original' | 'previous' | 'adopted') {
  return (
    <div className="review-item-objects">
      {['01', '02', '03'].map(value => kind === 'adopted'
        ? <DemoItem key={value}>{value}</DemoItem>
        : <div key={value} className={kind === 'previous' ? 'review-item-itemPrevious' : 'app-box'}>{value}</div>)}
    </div>
  )
}

function spacingTiles(candidate: boolean) {
  return (
    <div className="grid-cols:2 gap-md w:100% p-md r-md background-color:var(--stripe-pink) grid-cols:5@sm">
      {Array.from({ length: 10 }, (_, index) => candidate
        ? <DemoItem key={index} className="review-item-spacingTile">{index + 1}</DemoItem>
        : <div key={index} className="app-box">{index + 1}</div>)}
    </div>
  )
}

export default function Page() {
  return (
    <main className="review-item-review">
      <div className="review-item-kicker">Design system · Component review 02</div>
      <h1>Demo item</h1>
      <p className="review-item-intro">A specimen should read clearly on the striped canvas without deciding the lesson&apos;s dimensions or layout. The adopted surface restores the original raised, neutral object as the default; blue and violet remain deliberate teaching tones.</p>
      <div className="review-item-reviewNote" role="note">Approved direction: neutral raised paint is now the shared item default. Text, media, comparison and annotation primitives follow in separate rounds.</div>

      <section aria-labelledby="item-comparison">
        <h2 id="item-comparison">Default object</h2>
        <div className="review-item-comparison">
          <article className="review-item-option">
            <div className="review-item-optionHeading"><span>01</span><div><h3>Original</h3><p>Guide <code>app-box</code></p></div></div>
            <OriginalDemo>{specimen('original')}</OriginalDemo>
            <p className="review-item-optionNote">Raised neutral surface, solid border and compact radius.</p>
          </article>
          <article className="review-item-option">
            <div className="review-item-optionHeading"><span>02</span><div><h3>Previous</h3><p>Site <code>DemoItem</code> before refinement</p></div></div>
            <Demo>{specimen('previous')}</Demo>
            <p className="review-item-optionNote">Earlier blue tinted default; its caller supplied the dimensions.</p>
          </article>
          <article className="review-item-option">
            <div className="review-item-optionHeading"><span>03</span><div><h3>Adopted</h3><p>Shared <code>DemoItem</code></p></div></div>
            <Demo>{specimen('adopted')}</Demo>
            <p className="review-item-optionNote">Neutral raised default, quieter tint, crisp edge, explicit tone.</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="item-variants">
        <h2 id="item-variants">Tone and paint</h2>
        <p className="review-item-sectionCopy">Neutral objects support the scene; blue marks the subject and violet a comparison. The same dimensions below are supplied by the example, not the item.</p>
        <Demo>
          <div className="review-item-variantGrid">
            {(['neutral', 'blue', 'violet', 'amber'] as const).map(tone => (
              <div key={tone} className="review-item-variantGroup">
                <span>{tone}</span>
                {(['soft', 'solid', 'outline', 'ghost'] as const).map(variant => <div key={variant} className="review-item-variantCell">
                  <DemoItem tone={tone} variant={variant} className="review-item-variantItem">Aa</DemoItem>
                  <small>{variant}</small>
                </div>)}
              </div>
            ))}
          </div>
        </Demo>
        <p className="review-item-optionNote">This is a noninteractive <code>div</code>. It has no implied hover action or keyboard stop; use a native button or link for an action.</p>
      </section>

      <section aria-labelledby="item-real-use">
        <div className="review-item-sectionHeading">
          <div><h2 id="item-real-use">Actual Guide use</h2><p>The restored spacing guide uses ten original objects on a pink inner stripe.</p></div>
          <Link href="/guide/spacing">Open /guide/spacing</Link>
        </div>
        <div className="review-item-actualPair">
          <div><span className="review-item-pairLabel">Original Guide composition</span><OriginalDemo>{spacingTiles(false)}</OriginalDemo></div>
          <div><span className="review-item-pairLabel">Shared object in the same composition</span><Demo>{spacingTiles(true)}</Demo></div>
        </div>
        <p className="review-item-optionNote">The grid, gap, padding and pink pattern remain the lesson&apos;s own classes. Replacing the object paint does not change the spacing utility being taught.</p>
      </section>
    </main>
  )
}
