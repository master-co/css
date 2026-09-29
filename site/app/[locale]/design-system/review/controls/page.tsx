import Link from 'next/link'
import Demo from '~/site/components/demo/Demo'
import ButtonPreview from '~/site/app/[locale]/guide/syntax-tutorial/components/ButtonPreview'
import ControlsReviewScene from './ControlsReviewScene'
import './page.css'

export const metadata = {
  title: 'Demo controls review',
  description: 'Current Demo controls and practical examples.'
}

const guidePreview = <Demo><ButtonPreview responsive classes={['p-md', 'p-lg@sm', 'fg-blue-60:hover', 'fg-blue-60:focus-visible']} /></Demo>

const options = [
  {
    number: '01', title: 'Current', detail: 'Compact segmented control',
    note: 'An opt-in segmented variant gives exclusive choices a restrained group boundary, larger targets and a distinct selected segment.',
    preview: <ControlsReviewScene />
  }
] as const

export default function Page() {
  return <main className="review-controls-review">
    <div className="review-controls-kicker">Design system · Component review 12</div>
    <h1>Demo controls</h1>
    <p className="review-controls-intro">An opt-in segmented variant gives exclusive choices a restrained group boundary, larger targets and a distinct selected segment.</p>

    <section aria-labelledby="controls-options">
      <h2 id="controls-options">Select an alignment</h2>

      <div className="review-controls-options">
        {options.map(({ number, title, detail, note, preview }) => <article className="review-controls-option" key={number}>
          <div className="review-controls-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className="review-controls-optionPreview">{preview}</div>
          <p className="review-controls-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="controls-real-use">
      <div className="review-controls-sectionHeading">
        <div><h2 id="controls-real-use">Actual Guide use</h2><p>The Syntax Tutorial switches a real iframe across the <code>sm</code> breakpoint. The resulting button padding changes inside its own viewport.</p></div>
        <Link href="/guide/syntax-tutorial#conditions">Open /guide/syntax-tutorial</Link>
      </div>
      {guidePreview}
      <p className="review-controls-optionNote">The Guide’s UI stays as authored. The shared control treatment is for new demo scenes that need a reusable fieldset and a deliberate selection state.</p>
    </section>
  </main>
}
