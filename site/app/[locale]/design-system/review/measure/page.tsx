import Link from 'next/link'
import OriginalDemo from '~/site/docs-shell/components/Demo'
import ResizeZone from '~/site/docs-shell/components/ResizeZone'
import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import MeasureReviewStage from './MeasureReviewStage'
import './page.css'

export const metadata = {
  title: 'Demo measure review',
  description: 'Original Guide resize ruler, previous measurement line, and the adopted live measurement treatment.'
}

const options = [
  {
    number: '01', title: 'Original Guide', detail: 'Drag-to-resize ruler',
    note: 'The layout-system Guide uses ResizeZone. Its ruler appears while dragging on desktop; the content stays inside the resizable boundary.',
    preview: <OriginalDemo><div className="review-measure-originalStage">
      <ResizeZone width="100%" originX="center" showRuler>
        <div className="review-measure-originalContent"><strong>Workspace layout</strong><p>Drag the edge to reveal the original viewport ruler.</p></div>
      </ResizeZone>
    </div></OriginalDemo>
  },
  {
    number: '02', title: 'Previous', detail: 'Earlier shared DemoMeasure',
    note: 'The current label and bracket line show the observed width and height above the object.',
    preview: <Demo><MeasureReviewStage /></Demo>
  },
  {
    number: '03', title: 'Adopted', detail: 'Readable bounds annotation',
    note: 'A separated name and numeric readout sit above a full-width fine ruler. ResizeObserver still measures the content wrapper.',
    preview: <Demo><MeasureReviewStage adopted /></Demo>
  }
] as const

export default function Page() {
  return <main className="review-measure-review">
    <div className="review-measure-kicker">Design system · Component review 10</div>
    <h1>Demo measure</h1>
    <p className="review-measure-intro">Measurements should explain an actual box boundary. The adopted shared measure gives the dimensions clearer hierarchy while retaining the Guide’s thin ruler language.</p>
    <div className="review-measure-reviewNote" role="note">Approved default direction: the shared <code>DemoMeasure</code> uses the refined annotation. Use the width slider and detail toggle to test both axes. The controls sit outside the measured object.</div>

    <section aria-labelledby="measure-options">
      <h2 id="measure-options">Live content bounds</h2>
      <p className="review-measure-sectionCopy">The previous and adopted treatments measure the same panel. The original Guide demonstrates its own draggable ruler, which remains unchanged.</p>
      <div className="review-measure-options">
        {options.map(({ number, title, detail, note, preview }) => <article className="review-measure-option" key={number}>
          <div className="review-measure-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className="review-measure-optionPreview">{preview}</div>
          <p className="review-measure-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="measure-real-use">
      <div className="review-measure-sectionHeading">
        <div><h2 id="measure-real-use">Actual Reference use</h2><p>The width reference compares a fixed 192px object with a fluid object in the same containing block.</p></div>
        <Link href="/reference/width#set-a-fixed-or-fluid-width">Open /reference/width</Link>
      </div>
      <DemoExample page="width" section="set-a-fixed-or-fluid-width" />
      <p className="review-measure-optionNote">The Reference keeps its own true browser measurements. A shared annotation must report the box it observes rather than a requested CSS width.</p>
    </section>
  </main>
}
