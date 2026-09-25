import Link from 'next/link'
import OriginalDemo from '~/site/docs-shell/components/Demo'
import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import { DemoItem, DemoLabel, DemoScrollArea } from '~/site/components/demo'
import './page.css'

export const metadata = {
  title: 'Demo scroll area review',
  description: 'Original Guide wrapper, previous shared scroll area and the adopted bounded-region treatment.'
}

const layers = ['Background', 'Composition', 'Typography', 'Annotations', 'Export', 'Delivery']

function LayerList() {
  return <div className="review-scroll-layerList">{layers.map((name, index) => <DemoItem key={name} className="review-scroll-layer">
    <DemoLabel>0{index + 1}</DemoLabel><span>{name}</span>
  </DemoItem>)}</div>
}

const options = [
  {
    number: '01', title: 'Original Guide', detail: 'Plain scrollable content',
    note: 'The original Guide has no dedicated scroll-area primitive. This shows its existing striped Demo around a native overflow region.',
    preview: <OriginalDemo><div className="review-scroll-originalArea" role="region" aria-label="Original layer collection"><LayerList /></div></OriginalDemo>
  },
  {
    number: '02', title: 'Previous', detail: 'Shared DemoScrollArea',
    note: 'The previous component bounded overflow and was keyboard-focusable, but its edge was hard to distinguish from the striped canvas.',
    preview: <Demo><DemoScrollArea role="region" aria-label="Previous layer collection" className={`review-scroll-area review-scroll-previousArea`}><LayerList /></DemoScrollArea></Demo>
  },
  {
    number: '03', title: 'Adopted', detail: 'Clear local scroll boundary',
    note: 'A fine border, small radius and restrained inset surface make the focus and scroll boundary visible without changing the content layout.',
    preview: <Demo><DemoScrollArea role="region" aria-label="Adopted layer collection" className="review-scroll-area"><LayerList /></DemoScrollArea></Demo>
  }
] as const

export default function Page() {
  return <main className="review-scroll-review">
    <div className="review-scroll-kicker">Design system · Component review 13</div>
    <h1>Demo scroll area</h1>
    <p className="review-scroll-intro">A bounded collection should make it obvious where wheel and keyboard scrolling will stay. The scene keeps the original neutral stripes and puts the scroll boundary around the same six layer rows.</p>
    <div className="review-scroll-reviewNote" role="note">Adopted default: the shared <code>DemoScrollArea</code> now marks the native scroll boundary with a fine edge and a quiet surface. Focus either shared collection and use Arrow Down or Page Down; the page itself should stay still while the focused region scrolls.</div>

    <section aria-labelledby="scroll-options">
      <h2 id="scroll-options">Local vertical scrolling</h2>
      <p className="review-scroll-sectionCopy">Each region has the same content and an explicit height. The border treatment should help identify the actual scrollport, not change the lesson’s overflow property.</p>
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
        <Link href="/reference/overflow#create-a-scroll-container">Open /reference/overflow</Link>
      </div>
      <DemoExample page="overflow" section="create-a-scroll-container" />
      <p className="review-scroll-optionNote">The Reference remains responsible for its own scroll geometry. Shared decoration must never add a child that changes which element actually scrolls.</p>
    </section>
  </main>
}
