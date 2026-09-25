import Link from 'next/link'
import OriginalDemo from '~/site/docs-shell/components/Demo'
import ButtonPreview from '~/site/app/[locale]/guide/syntax-tutorial/components/ButtonPreview'
import ControlsReviewScene from './ControlsReviewScene'
import './page.css'

export const metadata = {
  title: 'Demo controls review',
  description: 'Original Guide viewport controls, previous shared fieldset and the adopted segmented variant.'
}

const original = <OriginalDemo><ButtonPreview responsive classes={['p-md', 'p-lg@sm', 'fg-blue-60:hover', 'fg-blue-60:focus-visible']} /></OriginalDemo>

const options = [
  {
    number: '01', title: 'Original Guide', detail: 'Simple outlined viewport choices',
    note: 'The Syntax Tutorial keeps two compact buttons and a live viewport status. These native controls remain in the Guide.',
    preview: original
  },
  {
    number: '02', title: 'Previous', detail: 'Shared plain fieldset and buttons',
    note: 'The fieldset gives the group an accessible name; small outlined buttons expose the active choice with aria-pressed.',
    preview: <ControlsReviewScene />
  },
  {
    number: '03', title: 'Adopted', detail: 'Compact segmented control',
    note: 'An opt-in segmented variant gives exclusive choices a restrained group boundary, larger targets and a distinct selected segment.',
    preview: <ControlsReviewScene candidate />
  }
] as const

export default function Page() {
  return <main className="review-controls-review">
    <div className="review-controls-kicker">Design system · Component review 12</div>
    <h1>Demo controls</h1>
    <p className="review-controls-intro">Controls should make one change easy to test while staying outside the layout being taught. Compare the Guide’s existing viewport switch with the shared alignment controls and a more deliberate grouped treatment.</p>
    <div className="review-controls-reviewNote" role="note">Approved default direction: <code>DemoControls variant=&quot;segmented&quot;</code> provides the grouped appearance for exclusive choices. Mixed slider and action toolbars keep the plain default. Use a mouse or keyboard to switch alignment; the selected button keeps <code>aria-pressed</code>, and the flex parent receives the actual Master CSS class.</div>

    <section aria-labelledby="controls-options">
      <h2 id="controls-options">Select an alignment</h2>
      <p className="review-controls-sectionCopy">Each shared treatment changes the same three items. The original Guide shows its own viewport choices, which already communicate state clearly.</p>
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
      {original}
      <p className="review-controls-optionNote">The Guide’s UI stays as authored. The shared control treatment is for new demo scenes that need a reusable fieldset and a deliberate selection state.</p>
    </section>
  </main>
}
