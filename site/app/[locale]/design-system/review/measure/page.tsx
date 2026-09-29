import Link from 'next/link'

import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import MeasureReviewStage from './MeasureReviewStage'
import './page.css'

export const metadata = {
  title: 'Demo measure review',
  description: 'Current Demo measure and practical examples.'
}

const options = [
  {
    number: '01', title: 'Current', detail: 'Readable bounds annotation',
    note: 'A separated name and numeric readout sit above a full-width fine ruler. ResizeObserver still measures the content wrapper.',
    preview: <Demo><MeasureReviewStage /></Demo>
  }
] as const

export default function Page() {
  return <main className="review-measure-review">
    <div className="review-measure-kicker">Design system · Component review 10</div>
    <h1>Demo measure</h1>
    <p className="review-measure-intro">A separated name and numeric readout sit above a full-width fine ruler. ResizeObserver still measures the content wrapper.</p>

    <section aria-labelledby="measure-options">
      <h2 id="measure-options">Live content bounds</h2>

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
        <Link href="/reference/tokens/container">Open /reference/tokens/container</Link>
      </div>
      <DemoExample page="width" section="set-a-fixed-or-fluid-width" />
      <p className="review-measure-optionNote">The Reference keeps its own true browser measurements. A shared annotation must report the box it observes rather than a requested CSS width.</p>
    </section>
  </main>
}
