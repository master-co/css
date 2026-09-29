import Link from 'next/link'
import Demo from '~/site/components/demo/Demo'
import { DemoItem } from '~/site/components/demo'
import './page.css'

export const metadata = {
  title: 'Demo item review',
  description: 'The current neutral Demo item and its explicit tone variants.'
}

function specimen() {
  return (
    <div className="review-item-objects">
      {['01', '02', '03'].map(value => <DemoItem key={value}>{value}</DemoItem>)}
    </div>
  )
}

function spacingTiles() {
  return (
    <div className="grid-cols(2) gap-md width:100% p-md r-md background-color:var(--stripe-pink) grid-cols(5)@sm">
      {Array.from({ length: 10 }, (_, index) => <DemoItem key={index} className="review-item-spacingTile">{index + 1}</DemoItem>)}
    </div>
  )
}

export default function Page() {
  return (
    <main className="review-item-review">
      <div className="review-item-kicker">Design system · Component review 02</div>
      <h1>Demo item</h1>
      <p className="review-item-intro">A specimen should read clearly on the striped canvas without deciding the lesson&apos;s dimensions or layout. Neutral paint is the default; blue and violet are deliberate teaching tones.</p>

      <section aria-labelledby="item-current">
        <h2 id="item-current">Default object</h2>
        <div className="review-item-current">
          <article className="review-item-option">
            <div className="review-item-optionHeading"><span>01</span><div><h3>Current item</h3><p>Shared <code>DemoItem</code></p></div></div>
            <Demo>{specimen()}</Demo>
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
          <div><h2 id="item-real-use">Spacing composition</h2><p>Ten items sit on the guide&apos;s pink inner stripe.</p></div>
          <Link href="/guide/spacing">Open /guide/spacing</Link>
        </div>
        <div className="review-item-actualUse">
          <div><span className="review-item-useLabel">Shared object in the composition</span><Demo>{spacingTiles()}</Demo></div>
        </div>
        <p className="review-item-optionNote">The grid, gap, padding and pink pattern remain the lesson&apos;s own classes.</p>
      </section>
    </main>
  )
}
