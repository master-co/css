import Link from 'next/link'
import OriginalDemo from '~/site/docs-shell/components/Demo'
import Demo from '~/site/components/demo/Demo'
import { DemoComparison } from '~/site/components/demo'
import { ShadowScaleDemo } from '~/site/app/[locale]/guide/elevation/components/ShadowTokens'
import './page.css'

export const metadata = {
  title: 'Demo comparison review',
  description: 'Comparison of the original Guide grid, previous shared comparison and approved layout.'
}

const specimens = [
  { key: 'sm', utility: 'shadow-sm', role: 'Standard surface', description: 'Cards, reusable panels, and quiet product surfaces.' },
  { key: 'lg', utility: 'shadow-lg', role: 'Detached overlay', description: 'Dropdowns, popovers, toasts, and menus.' }
] as const

function ShadowSpecimens() {
  return specimens.map(({ key, utility, role, description }) => (
    <div className={`review-comparison-specimen surface-raised r-lg p-lg ${key === 'sm' ? 'shadow-sm' : 'shadow-lg'}`} key={key}>
      <code className="review-comparison-utility">{utility}</code>
      <div className="review-comparison-role">{role}</div>
      <p className="review-comparison-description">{description}</p>
    </div>
  ))
}

function OriginalComparison() {
  return <div className="container w:100%"><div className="grid-cols:1 gap-xl w:100% grid-cols:2@container((width>=18rem))"><ShadowSpecimens /></div></div>
}

const options = [
  {
    number: '01', title: 'Original Guide', detail: 'Local shadow-scale grid',
    note: 'The Guide controls its own responsive columns and generous gap.',
    preview: <OriginalDemo><OriginalComparison /></OriginalDemo>
  },
  {
    number: '02', title: 'Previous', detail: 'Earlier shared DemoComparison',
    note: 'The earlier auto-fit grid uses a 14rem minimum and the medium gap.',
    preview: <Demo><div className="review-comparison-previous"><ShadowSpecimens /></div></Demo>
  },
  {
    number: '03', title: 'Adopted', detail: 'Shared DemoComparison',
    note: 'A 17rem reading minimum and larger gap keep both specimens clear before stacking.',
    preview: <Demo><DemoComparison><ShadowSpecimens /></DemoComparison></Demo>
  }
] as const

export default function Page() {
  return <main className="review-comparison-review">
    <div className="review-comparison-kicker">Design system · Component review 07</div>
    <h1>Demo comparison</h1>
    <p className="review-comparison-intro">The original Guide arranges related examples in a spacious responsive grid. The approved shared comparison preserves that calm rhythm and keeps specimens readable before it asks them to sit side by side.</p>
    <div className="review-comparison-reviewNote" role="note">Approved direction: <code>DemoComparison</code> uses wider reading columns and a larger gap. It adds no frame, padding, labels, child wrappers or paint that could change the CSS lesson.</div>

    <section aria-labelledby="comparison-options">
      <h2 id="comparison-options">Two elevation specimens</h2>
      <p className="review-comparison-sectionCopy">The same <code>shadow-sm</code> and <code>shadow-lg</code> cards appear in each treatment. Resize the page to see when the pair stacks.</p>
      <div className="review-comparison-options">
        {options.map(({ number, title, detail, note, preview }) => <article className="review-comparison-option" key={number}>
          <div className="review-comparison-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className="review-comparison-optionPreview">{preview}</div>
          <p className="review-comparison-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="comparison-real-use">
      <div className="review-comparison-sectionHeading">
        <div><h2 id="comparison-real-use">Actual Guide use</h2><p>The elevation guide keeps its original six-card shadow scale.</p></div>
        <Link href="/guide/elevation">Open /guide/elevation</Link>
      </div>
      <ShadowScaleDemo />
      <p className="review-comparison-optionNote">The shared layout is available for future comparisons. The existing Guide grid remains intact.</p>
    </section>
  </main>
}
