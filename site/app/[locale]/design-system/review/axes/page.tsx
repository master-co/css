import Link from 'next/link'
import OriginalDemo from '~/site/docs-shell/components/Demo'
import OriginalDemoLabel from '~/site/docs-shell/components/DemoLabel'
import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import { DemoAxes, DemoItem, DemoSurface } from '~/site/components/demo'
import './page.css'

export const metadata = {
  title: 'Demo axes review',
  description: 'Original Guide labels, previous shared axes and the adopted annotation frame.'
}

function Items() {
  return <DemoSurface className="review-axes-layout">
    <DemoItem tone="blue" className="review-axes-item">01</DemoItem>
    <DemoItem tone="violet" className="review-axes-item">02</DemoItem>
    <DemoItem className="review-axes-item">03</DemoItem>
  </DemoSurface>
}

function PreviousAxes() {
  return <div className="review-axes-previousAxes">
    <div className="review-axes-previousInline"><span>Main axis</span><span aria-hidden="true">→</span></div>
    <div className="review-axes-previousBlock"><span>Cross axis</span><span aria-hidden="true">↓</span></div>
    <Items />
  </div>
}

function CandidateAxes() {
  return <DemoAxes role="group" aria-label="Row layout: main axis rightward, cross axis downward"><Items /></DemoAxes>
}

const options = [
  {
    number: '01', title: 'Original Guide', detail: 'Labels beside the composition',
    note: 'The original Guide uses attached labels to identify a composition. It does not have a reusable axis frame.',
    preview: <OriginalDemo><div className="review-axes-originalStage"><OriginalDemoLabel>Row layout · main axis left to right</OriginalDemoLabel><Items /></div></OriginalDemo>
  },
  {
    number: '02', title: 'Previous', detail: 'Earlier shared DemoAxes',
    note: 'The existing small labels and arrows sit outside the flex items, but the one-pixel lines and text are difficult to scan.',
    preview: <Demo><PreviousAxes /></Demo>
  },
  {
    number: '03', title: 'Adopted', detail: 'Directional annotation frame',
    note: 'An aligned pair of rules makes the two axes distinct. The line and arrow remain decorative; text names the directions.',
    preview: <Demo><CandidateAxes /></Demo>
  }
] as const

export default function Page() {
  return <main className="review-axes-review">
    <div className="review-axes-kicker">Design system · Component review 11</div>
    <h1>Demo axes</h1>
    <p className="review-axes-intro">Axis annotations should explain the direction of the actual layout without becoming flex items. This review uses a left-to-right row, where the main axis points right and the cross axis points down.</p>
    <div className="review-axes-reviewNote" role="note">Approved default direction: the shared <code>DemoAxes</code> uses the refined frame. For vertical or reversed layouts, the arrows and labels must follow the actual writing mode and flex direction.</div>

    <section aria-labelledby="axes-options">
      <h2 id="axes-options">Horizontal flex layout</h2>
      <p className="review-axes-sectionCopy">Each treatment shows the same three items and the same real flex direction. Labels are outside the teaching layout.</p>
      <div className="review-axes-options">
        {options.map(({ number, title, detail, note, preview }) => <article className="review-axes-option" key={number}>
          <div className="review-axes-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className="review-axes-optionPreview">{preview}</div>
          <p className="review-axes-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="axes-real-use">
      <div className="review-axes-sectionHeading">
        <div><h2 id="axes-real-use">Actual Reference use</h2><p>The flex-direction reference demonstrates the same row direction and explains why writing mode matters.</p></div>
        <Link href="/reference/flex-direction#lay-out-items-in-a-row">Open /reference/flex-direction</Link>
      </div>
      <DemoExample page="flex-direction" section="lay-out-items-in-a-row" />
      <p className="review-axes-optionNote">The Reference demo uses real <code>flex flex-row</code> classes. An arrow is only correct here because this specimen uses horizontal writing and left-to-right text.</p>
    </section>
  </main>
}
