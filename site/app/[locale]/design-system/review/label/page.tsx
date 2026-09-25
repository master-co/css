import Link from 'next/link'
import OriginalDemo from '~/site/docs-shell/components/Demo'
import OriginalDemoLabel from '~/site/docs-shell/components/DemoLabel'
import Demo from '~/site/components/demo/Demo'
import { DemoLabel, DemoSurface } from '~/site/components/demo'
import { ShadowScaleDemo } from '~/site/app/[locale]/guide/elevation/components/ShadowTokens'
import './page.css'

export const metadata = {
  title: 'Demo label review',
  description: 'Original Guide label, current shared label, and a refined candidate for review.'
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

function OriginalSpecimen() {
  return <div className="review-label-specimens">
    <div><OriginalDemoLabel>shadow-sm</OriginalDemoLabel><DemoSurface className="review-label-card"><strong>Standard surface</strong><p>One utility, one visible effect.</p></DemoSurface></div>
    <div><OriginalDemoLabel>Collection / 024</OriginalDemoLabel><DemoSurface className="review-label-card"><strong>Asset library</strong><p>Descriptive metadata stays readable.</p></DemoSurface></div>
    <div><OriginalDemoLabel>width:100% min-width:0 @container((width&gt;=28rem))</OriginalDemoLabel><DemoSurface className="review-label-card"><strong>Long class string</strong><p>The annotation wraps inside a narrow document column.</p></DemoSurface></div>
  </div>
}

function PreviousLabel({ className, ...props }: Parameters<typeof DemoLabel>[0]) {
  return <span {...props} className={['review-label-previousLabel', className].filter(Boolean).join(' ')} />
}

const options = [
  {
    number: '01', title: 'Original Guide', detail: 'Small muted mono label',
    note: 'A block label with its own bottom margin, as used by the original Guide.',
    preview: <OriginalDemo><OriginalSpecimen /></OriginalDemo>
  },
  {
    number: '02', title: 'Previous', detail: 'Earlier shared inline label',
    note: 'Small mono text that joins the surrounding line and has no built-in spacing.',
    preview: <Demo><Specimen Label={PreviousLabel} /></Demo>
  },
  {
    number: '03', title: 'Adopted', detail: 'Readable annotation',
    note: 'A slightly larger, weight-balanced mono label with tabular numerals and explicit wrapping; spacing remains with the scene.',
    preview: <Demo><Specimen Label={DemoLabel} /></Demo>
  }
] as const

export default function Page() {
  return <main className="review-label-review">
    <div className="review-label-kicker">Design system · Component review 08</div>
    <h1>Demo label</h1>
    <p className="review-label-intro">Labels identify a class, object or condition without becoming the lesson. The adopted shared label keeps the original Guide’s quiet monospace character and improves small-text readability.</p>
    <div className="review-label-reviewNote" role="note">Approved direction: the shared <code>DemoLabel</code> uses the refined text treatment. The original Guide labels retain their established styling.</div>

    <section aria-labelledby="label-options">
      <h2 id="label-options">Class and metadata labels</h2>
      <p className="review-label-sectionCopy">Each treatment shows the same class, descriptive name, and long utility string above a specimen. The cards and their content are identical.</p>
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
