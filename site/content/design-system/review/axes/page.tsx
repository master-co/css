import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import AnnotationComposition from './AnnotationComposition'
import Link from '~/site/docs-shell/components/Link'

import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import { DemoAxes, DemoItem, DemoSurface } from '~/site/components/demo'
import './page.css'

export { metadata }

function Items() {
  return <DemoSurface className="review-axes-layout">
    <DemoItem tone="blue" className="review-axes-item">01</DemoItem>
    <DemoItem tone="violet" className="review-axes-item">02</DemoItem>
    <DemoItem className="review-axes-item">03</DemoItem>
  </DemoSurface>
}

function CurrentAxes() {
  return <DemoAxes role="group" aria-label="Row layout: main axis rightward, cross axis downward"><Items /></DemoAxes>
}

const options = [
  {
    number: '01', note: 'An aligned pair of rules makes the two axes distinct. The line and arrow remain decorative; text names the directions.',
    preview: <Demo><CurrentAxes /></Demo>
  }
] as const

export default function Page() {
  return <main className="ds-component-page review-axes-review">
    <ReviewNavigation />
    <h1>Demo axes</h1>
    <p className="review-axes-intro">An aligned pair of rules makes the two axes distinct. The line and arrow remain decorative; text names the directions.</p>

    <section aria-labelledby="axes-options">
      <h2 id="axes-options">Horizontal flex layout</h2>

      <div className="review-axes-options">
        {options.map(({ number, note, preview }) => <article className="review-axes-option" key={number}>
          <div className="review-axes-optionPreview">{preview}</div>
          <p className="review-axes-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="axes-composition">
      <h2 id="axes-composition">Axes with content bounds</h2>
      <AnnotationComposition />
    </section>

    <section aria-labelledby="axes-real-use">
      <div className="review-axes-sectionHeading">
        <div><h2 id="axes-real-use">Actual Reference use</h2><p>The flex-direction reference demonstrates the same row direction and explains why writing mode matters.</p></div>
        <Link href="https://developer.mozilla.org/en-US/docs/Web/CSS/flex-direction">Open https://developer.mozilla.org/en-US/docs/Web/CSS/flex-direction</Link>
      </div>
      <DemoExample page="flex-direction" section="lay-out-items-in-a-row" />
      <p className="review-axes-optionNote">The Reference demo uses real <code>flex flex-row</code> classes. An arrow is only correct here because this specimen uses horizontal writing and left-to-right text.</p>
    </section>
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
