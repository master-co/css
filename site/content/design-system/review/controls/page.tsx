import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'
import Segments from '~/site/docs-shell/components/Segments'
import Demo from '~/site/components/demo/Demo'
import ButtonPreview from '~/site/content/guide/syntax-tutorial/components/ButtonPreview'
import ControlsReviewScene from './ControlsReviewScene'
import './page.css'

export { metadata }

const guidePreview = <Demo frame="none" padding="none"><ButtonPreview responsive classes={['p-md', 'p-lg@sm', 'fg-blue-60:hover', 'fg-blue-60:focus-visible']} /></Demo>

const options = [
  {
    number: '01', note: 'An opt-in segmented variant gives exclusive choices a restrained group boundary, larger targets and a distinct selected segment.',
    preview: <ControlsReviewScene />
  }
] as const

export default function Page() {
  return <main className="ds-component-page review-controls-review">
    <ReviewNavigation />
    <h1>Demo controls</h1>
    <p className="review-controls-intro">An opt-in segmented variant gives exclusive choices a restrained group boundary, larger targets and a distinct selected segment.</p>

    <section aria-labelledby="controls-options">
      <h2 id="controls-options">Select an alignment</h2>

      <div className="review-controls-options">
        {options.map(({ number, note, preview }) => <article className="review-controls-option" key={number}>
          <div className="review-controls-optionPreview">{preview}</div>
          <p className="review-controls-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="document-views">
      <h2 id="document-views">Related document views</h2>
      <p className="review-controls-optionNote">Use arrow keys to move between views. Home and End reach the first and last view; Tab moves into the selected panel.</p>
      <div className="review-controls-documentViews">
        <Segments label="Document view example">{[
          { name: 'Overview', content: <p>A short explanation stays beside the example.</p> },
          { name: 'Details', content: <p>Supporting details remain available in the HTML, including when JavaScript is disabled.</p> }
        ]}</Segments>
      </div>
    </section>

    <section aria-labelledby="controls-real-use">
      <div className="review-controls-sectionHeading">
        <div><h2 id="controls-real-use">Viewport conditions</h2><p>The presets cross the <code>sm</code> breakpoint inside a real iframe. Its button padding follows the viewport; the Syntax Tutorial compares viewport and container conditions.</p></div>
        <Link href="/guide/syntax-tutorial#conditions">Open /guide/syntax-tutorial</Link>
      </div>
      {guidePreview}
      <p className="review-controls-optionNote">The shared viewport owns the controls; the native button keeps its generated padding and interaction classes.</p>
    </section>
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
