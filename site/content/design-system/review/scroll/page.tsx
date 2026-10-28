import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'

import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import { DemoItem, DemoLabel, DemoScrollArea } from '~/site/components/demo'
import './page.css'

export { metadata }

const layers = ['Background', 'Composition', 'Typography', 'Annotations', 'Export', 'Delivery']

function LayerList() {
  return <div className="review-scroll-layerList">{layers.map((name, index) => <DemoItem key={name} className="review-scroll-layer">
    <DemoLabel>0{index + 1}</DemoLabel><span>{name}</span>
  </DemoItem>)}</div>
}

const options = [
  {
    number: '01', note: 'A fine border, small radius and restrained inset surface make the focus and scroll boundary visible without changing the content layout.',
    preview: <Demo><DemoScrollArea role="region" aria-label="Layer collection" className="review-scroll-area"><LayerList /></DemoScrollArea></Demo>
  }
] as const

export default function Page() {
  return <main className="ds-component-page review-scroll-review">
    <ReviewNavigation />
    <h1>Demo scroll area</h1>
    <p className="review-scroll-intro">A fine border, small radius and restrained inset surface make the focus and scroll boundary visible without changing the content layout.</p>

    <section aria-labelledby="scroll-options">
      <h2 id="scroll-options">Local vertical scrolling</h2>

      <div className="review-scroll-options">
        {options.map(({ number, note, preview }) => <article className="review-scroll-option" key={number}>
          <div className="review-scroll-optionPreview">{preview}</div>
          <p className="review-scroll-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="scroll-real-use">
      <div className="review-scroll-sectionHeading">
        <div><h2 id="scroll-real-use">Actual Reference use</h2><p>The overflow reference shows separate vertical and horizontal scroll containers with true CSS utility classes.</p></div>
        <Link href="https://developer.mozilla.org/en-US/docs/Web/CSS/overflow">Open https://developer.mozilla.org/en-US/docs/Web/CSS/overflow</Link>
      </div>
      <DemoExample page="overflow" section="create-a-scroll-container" />
      <p className="review-scroll-optionNote">The Reference remains responsible for its own scroll geometry. Shared decoration must never add a child that changes which element actually scrolls.</p>
    </section>
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
