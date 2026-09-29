import Link from 'next/link'

import Demo from '~/site/components/demo/Demo'
import { DemoLabel, DemoSurface } from '~/site/components/demo'
import { ShadowScaleDemo } from '~/site/app/[locale]/guide/elevation/components/ShadowTokens'
import './page.css'

export const metadata = {
  title: 'Demo label review',
  description: 'Current Demo label and practical examples.'
}

function Specimen({ Label }: { Label: typeof DemoLabel }) {
  return <div className="review-label-specimens">
    <div>
      <Label>shadow-sm</Label>
      <DemoSurface className="review-label-card">
        <strong>Standard surface</strong>
        <p>One utility, one visible effect.</p>
      </DemoSurface>
    </div>
    <div>
      <Label>Collection / 024</Label>
      <DemoSurface className="review-label-card">
        <strong>Asset library</strong>
        <p>Descriptive metadata stays readable.</p>
      </DemoSurface>
    </div>
    <div>
      <Label>width:100% min-width:0 @container((width&gt;=28rem))</Label>
      <DemoSurface className="review-label-card">
        <strong>Long class string</strong>
        <p>The annotation wraps inside a narrow document column.</p>
      </DemoSurface>
    </div>
  </div>
}

const options = [
  {
    number: '01', title: 'Current', detail: 'Readable annotation',
    note: 'A slightly larger, weight-balanced mono label with tabular numerals and explicit wrapping; spacing remains with the scene.',
    preview: <Demo><Specimen Label={DemoLabel} /></Demo>
  }
] as const

export default function Page() {
  return <main className="review-label-review">
    <div className="review-label-kicker">Design system · Component review 08</div>
    <h1>Demo label</h1>
    <p className="review-label-intro">A slightly larger, weight-balanced mono label with tabular numerals and explicit wrapping; spacing remains with the scene.</p>

    <section aria-labelledby="label-options">
      <h2 id="label-options">Class and metadata labels</h2>

      <div className="review-label-options">
        {options.map(({ number, title, detail, note, preview }) => <article className="review-label-option" key={number}>
          <div className="review-label-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className="review-label-optionPreview">{preview}</div>
          <p className="review-label-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="label-real-use">
      <div className="review-label-sectionHeading">
        <div><h2 id="label-real-use">Actual Guide use</h2><p>The elevation guide retains its original utility labels above the shadow specimens.</p></div>
        <Link href="/guide/elevation">Open /guide/elevation</Link>
      </div>
      <ShadowScaleDemo />
      <p className="review-label-optionNote">The shared label changes text treatment only. The lesson continues to own its card geometry, alignment and spacing.</p>
    </section>
  </main>
}
