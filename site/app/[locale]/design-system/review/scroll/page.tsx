import Link from 'next/link'

import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import { DemoItem, DemoLabel, DemoScrollArea } from '~/site/components/demo'
import './page.css'

export const metadata = {
  title: 'Demo scroll area review',
  description: 'Current Demo scroll area and practical examples.'
}

const layers = ['Background', 'Composition', 'Typography', 'Annotations', 'Export', 'Delivery']

function LayerList() {
  return <div className="review-scroll-layerList">{layers.map((name, index) => <DemoItem key={name} className="review-scroll-layer">
    <DemoLabel>0{index + 1}</DemoLabel><span>{name}</span>
  </DemoItem>)}</div>
}

const options = [
  {
    number: '01', title: 'Current', detail: 'Clear local scroll boundary',
    note: 'A fine border, small radius and restrained inset surface make the focus and scroll boundary visible without changing the content layout.',
    preview: <Demo><DemoScrollArea role="region" aria-label="Layer collection" className="review-scroll-area"><LayerList /></DemoScrollArea></Demo>
  }
] as const

export default function Page() {
  return <main className="review-scroll-review">
    <div className="review-scroll-kicker">Design system · Component review 13</div>
    <h1>Demo scroll area</h1>
    <p className="review-scroll-intro">A fine border, small radius and restrained inset surface make the focus and scroll boundary visible without changing the content layout.</p>

    <section aria-labelledby="scroll-options">
      <h2 id="scroll-options">Local vertical scrolling</h2>

      <div className="review-scroll-options">
        {options.map(({ number, title, detail, note, preview }) => <article className="review-scroll-option" key={number}>
          <div className="review-scroll-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
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
  </main>
}
