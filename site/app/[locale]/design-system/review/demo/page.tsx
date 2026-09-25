import Link from 'next/link'
import OriginalDemo from '~/site/docs-shell/components/Demo'
import Demo from '~/site/components/demo/Demo'
import DemoViewport from '~/site/components/demo/DemoViewport'
import { referenceDemoSections } from '~/site/components/demo/reference/source'
import { referenceScenes } from '~/site/components/demo/reference/scenes'
import { demoDocument } from '~/site/components/demo/reference/document'
import './page.css'

export const metadata = {
  title: 'Demo canvas review',
  description: 'Review-only comparison of the original, current and proposed Demo canvas.'
}

function specimen() {
  return (
    <div className="review-demo-objects">
      <div className="app-box">01</div>
      <div className="app-box">02</div>
      <div className="app-box">03</div>
    </div>
  )
}

export default async function Page() {
  const source = (await referenceDemoSections('clear')).find(item => item.id === 'clearing-left-floats')
  if (!source) throw new Error('Missing clear reference scene')
  const scene = referenceScenes.clear(source)

  return (
    <main className="review-demo-review">
      <div className="review-demo-kicker">Design system · Component review 01</div>
      <h1>Demo canvas</h1>
      <p className="review-demo-intro">The same teaching objects in three canvas treatments. The candidate restores the original neutral diagonal stripe, border and quiet spacing. Its default has no title or toolbar.</p>
      <div className="review-demo-reviewNote" role="note">Review scope: canvas shell only. Objects, labels and controls will be refined in later rounds.</div>

      <section aria-labelledby="canvas-comparison">
        <h2 id="canvas-comparison">Default canvas</h2>
        <div className="review-demo-comparison">
          <article className="review-demo-option">
            <div className="review-demo-optionHeading"><span>01</span><div><h3>Original</h3><p>Guide shell at HEAD</p></div></div>
            <OriginalDemo>{specimen()}</OriginalDemo>
            <p className="review-demo-optionNote">Neutral 7.5px stripe, thin border, 32px / 48px padding.</p>
          </article>
          <article className="review-demo-option">
            <div className="review-demo-optionHeading"><span>02</span><div><h3>Before</h3><p>Previous site-owned treatment</p></div></div>
            <div className="review-demo-previousDemo"><div className="review-demo-previousCanvas">{specimen()}</div></div>
            <p className="review-demo-optionNote">20px grid and tighter default padding.</p>
          </article>
          <article className="review-demo-option">
            <div className="review-demo-optionHeading"><span>03</span><div><h3>Adopted</h3><p>Current shared Demo</p></div></div>
            <Demo>{specimen()}</Demo>
            <p className="review-demo-optionNote">Original stripe and space, with site-owned optional framing.</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="real-usage">
        <div className="review-demo-sectionHeading">
          <div><h2 id="real-usage">Actual Reference use</h2><p>The <code>clear:left</code> scene keeps its own float geometry and iframe isolation.</p></div>
          <Link href="/reference/clear#clearing-left-floats">Open /reference/clear</Link>
        </div>
        <div className="review-demo-actualUsage">
          <Demo title={source.title} description="A title appears only because this lesson needs to identify the comparison." caption={scene.caption} padding="none">
            <DemoViewport title={`clear: ${source.title}`} document={demoDocument(source, scene)}
              responsive={scene.responsive ?? false} theme={scene.theme ?? false} print={false}
              motion={scene.motion} inspect={scene.inspect} height={scene.height}
              maxWidth={scene.maxWidth} sizing={scene.sizing} />
          </Demo>
          <p className="review-demo-optionNote">The shared canvas adds no child to the float layout; the iframe owns the scene dimensions.</p>
        </div>
      </section>

      <section aria-labelledby="optional-chrome">
        <h2 id="optional-chrome">Optional title, guidance and focus</h2>
        <div className="review-demo-optionalUsage">
          <Demo title="Inspect the spacing" description="The annotation sits outside the teaching canvas." controls={<Link href="/guide/spacing">Read spacing guide</Link>}>
            {specimen()}
          </Demo>
        </div>
      </section>
    </main>
  )
}
