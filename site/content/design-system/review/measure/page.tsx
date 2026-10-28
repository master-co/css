import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'

import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import MeasureReviewStage from './MeasureReviewStage'
import './page.css'

export { metadata }

const options = [
  {
    number: '01', note: 'A separated name and numeric readout sit above a full-width fine ruler. ResizeObserver still measures the content wrapper.',
    preview: <Demo><MeasureReviewStage /></Demo>
  }
] as const

export default function Page() {
  return <main className="ds-component-page review-measure-review">
    <ReviewNavigation />
    <h1>Demo measure</h1>
    <p className="review-measure-intro">A separated name and numeric readout sit above a full-width fine ruler. ResizeObserver still measures the content wrapper.</p>

    <section aria-labelledby="measure-options">
      <h2 id="measure-options">Live content bounds</h2>

      <div className="review-measure-options">
        {options.map(({ number, note, preview }) => <article className="review-measure-option" key={number}>
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
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
