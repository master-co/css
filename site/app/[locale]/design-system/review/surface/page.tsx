import Link from 'next/link'
import Demo from '~/site/components/demo/Demo'
import { DemoItem, DemoSurface, DemoText } from '~/site/components/demo'
import './page.css'

export const metadata = {
  title: 'Demo surface review',
  description: 'The current shared Demo surface and elevation option.'
}

function content() {
  return <><span className="review-surface-eyebrow">COLLECTION / 024</span><div className="review-surface-cardTitle">Field notes</div><p className="review-surface-cardCopy">A stable backdrop for the object and its supporting text.</p></>
}

function ReferenceExample() {
  return (
    <Demo title="Column span" caption="The surface contains real columns. Padding and columns belong to the lesson.">
      <DemoSurface className="p-md font-sm">
        <div className="gap-md columns:2">
          <DemoText className="margin-inline:0 mb-sm margin-top:0">Start with the collection overview and its key details.</DemoText>
          <DemoItem tone="blue" className="my-sm p-sm font-medium">Collection notes</DemoItem>
          <DemoText className="margin:0">Continue through each column in reading order, then move to the next section.</DemoText>
        </div>
      </DemoSurface>
    </Demo>
  )
}

export default function Page() {
  return (
    <main className="review-surface-review">
      <div className="review-surface-kicker">Design system · Component review 06</div>
      <h1>Demo surface</h1>
      <p className="review-surface-intro">The shared surface provides a fine border by default and optional elevation. Padding and geometry remain owned by the example.</p>

      <section aria-labelledby="bg-surface-current">
        <h2 id="bg-surface-current">Basic content panel</h2>
        <div className="review-surface-current">
          <article className="review-surface-option">
            <div className="review-surface-optionHeading"><span>01</span><div><h3>Current surface</h3><p>Shared <code>DemoSurface</code></p></div></div>
            <Demo><div className="review-surface-surfaceStage"><DemoSurface elevation="raised" className="p-md">{content()}</DemoSurface></div></Demo>
            <p className="review-surface-optionNote">A precise edge, compact radius and opt-in shadow for a genuinely raised layer.</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="bg-surface-variants">
        <h2 id="bg-surface-variants">Flat and raised treatments</h2>
        <p className="review-surface-sectionCopy">The two treatments share the same dimensions. Elevation is used only where stacking is part of the explanation.</p>
        <Demo>
          <div className="review-surface-treatmentGrid">
            <div><span className="review-surface-useLabel">Default · no elevation</span><DemoSurface className="p-md"><div className="review-surface-cardTitle">Layout surface</div><p className="review-surface-cardCopy">Keeps an example legible without implying a floating layer.</p></DemoSurface></div>
            <div><span className="review-surface-useLabel">Raised · explicit elevation</span><DemoSurface elevation="raised" className="p-md"><div className="review-surface-cardTitle">Floating layer</div><p className="review-surface-cardCopy">Shows a stacked panel when depth is actually relevant.</p></DemoSurface></div>
          </div>
        </Demo>
        <p className="review-surface-optionNote">Use explicit classes for padding, flex/grid, dimensions, position and overflow. The raised treatment adds visual shadow only.</p>
      </section>

      <section aria-labelledby="bg-surface-real-use">
        <div className="review-surface-sectionHeading">
          <div><h2 id="bg-surface-real-use">Actual Reference use</h2><p>The surface must not become an extra column or change the content box.</p></div>
          <Link href="https://developer.mozilla.org/en-US/docs/Web/CSS/column-span">Open https://developer.mozilla.org/en-US/docs/Web/CSS/column-span</Link>
        </div>
        <div className="review-surface-actualUse">
          <div><span className="review-surface-useLabel">Shared surface</span><ReferenceExample /></div>
        </div>
      </section>
    </main>
  )
}
