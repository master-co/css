import Link from 'next/link'
import Demo from '~/site/components/demo/Demo'
import DemoViewport from '~/site/components/demo/DemoViewport'
import { referenceDemoSections } from '~/site/components/demo/reference/source'
import { referenceScenes } from '~/site/components/demo/reference/scenes'
import { demoDocument } from '~/site/components/demo/reference/document'
import './page.css'

export const metadata = {
  title: 'Demo canvas review',
  description: 'The current shared Demo canvas and its optional framing.'
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
      <p className="review-demo-intro">The shared canvas uses a neutral diagonal stripe, thin border and quiet spacing. Titles and controls appear only when a lesson needs them.</p>

      <section aria-labelledby="canvas-current">
        <h2 id="canvas-current">Default canvas</h2>
        <div className="review-demo-current">
          <article className="review-demo-option">
            <div className="review-demo-optionHeading"><span>01</span><div><h3>Current Demo</h3><p>Shared canvas</p></div></div>
            <Demo>{specimen()}</Demo>
            <p className="review-demo-optionNote">Neutral stripe and space, with optional site-owned framing.</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="real-usage">
        <div className="review-demo-sectionHeading">
          <div><h2 id="real-usage">Actual Reference use</h2><p>The <code>clear:left</code> scene keeps its own float geometry and iframe isolation.</p></div>
          <Link href="https://developer.mozilla.org/en-US/docs/Web/CSS/clear">Open https://developer.mozilla.org/en-US/docs/Web/CSS/clear</Link>
        </div>
        <div className="review-demo-actualUsage">
          <Demo title={source.title} description="The title identifies this lesson's CSS subject." caption={scene.caption} padding="none">
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
