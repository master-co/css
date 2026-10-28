import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'
import Demo from '~/site/components/demo/Demo'
import DemoViewport from '~/site/components/demo/DemoViewport'
import { referenceDemoSections } from '~/site/components/demo/reference/source'
import { referenceScenes } from '~/site/components/demo/reference/scenes'
import { demoDocument } from '~/site/components/demo/reference/document'
import './page.css'

export { metadata }

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
    <main className="ds-component-page review-demo-review">
      <ReviewNavigation />
      <h1>Demo canvas</h1>
      <p className="review-demo-intro">The shared canvas uses a plain neutral surface, a fine contour and quiet spacing. Titles and controls appear only when a lesson needs them.</p>

      <section aria-labelledby="canvas-current">
        <h2 id="canvas-current">Default canvas</h2>
        <div className="review-demo-current">
          <article className="review-demo-option">
            <Demo>{specimen()}</Demo>
            <p className="review-demo-optionNote">A plain surface with optional, purpose-specific patterns.</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="real-usage">
        <div className="review-demo-sectionHeading">
          <div><h2 id="real-usage">Actual Reference use</h2><p>The <code>clear:left</code> scene keeps its own float geometry and iframe isolation.</p></div>
          <Link href="https://developer.mozilla.org/en-US/docs/Web/CSS/clear">Open https://developer.mozilla.org/en-US/docs/Web/CSS/clear</Link>
        </div>
        <div className="review-demo-actualUsage">
          <Demo title={source.title} description="The title identifies this lesson's CSS subject." caption={scene.caption} padding="none" frame="none">
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
    <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
  )
}
