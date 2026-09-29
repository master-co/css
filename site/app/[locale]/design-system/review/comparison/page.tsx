import Link from 'next/link'

import Demo from '~/site/components/demo/Demo'
import { DemoComparison } from '~/site/components/demo'
import { ShadowScaleDemo } from '~/site/app/[locale]/guide/elevation/components/ShadowTokens'
import './page.css'

export const metadata = {
  title: 'Demo comparison review',
  description: 'Current Demo comparison and practical examples.'
}

const specimens = [
  { key: 'sm', utility: 'shadow-sm', role: 'Standard surface', description: 'Cards, reusable panels, and quiet product surfaces.' },
  { key: 'lg', utility: 'shadow-lg', role: 'Detached overlay', description: 'Dropdowns, popovers, toasts, and menus.' }
] as const

function ShadowSpecimens() {
  return specimens.map(({ key, utility, role, description }) => (
    <div className={`review-comparison-specimen bg-surface-raised r-lg p-lg ${key === 'sm' ? 'shadow-sm' : 'shadow-lg'}`} key={key}>
      <code className="review-comparison-utility">{utility}</code>
      <div className="review-comparison-role">{role}</div>
      <p className="review-comparison-description">{description}</p>
    </div>
  ))
}

const options = [
  {
    number: '01', title: 'Current', detail: 'Shared DemoComparison',
    note: 'A 17rem reading minimum and larger gap keep both specimens clear before stacking.',
    preview: <Demo><DemoComparison><ShadowSpecimens /></DemoComparison></Demo>
  }
] as const

export default function Page() {
  return <main className="review-comparison-review">
    <div className="review-comparison-kicker">Design system · Component review 07</div>
    <h1>Demo comparison</h1>
    <p className="review-comparison-intro">A 17rem reading minimum and larger gap keep both specimens clear before stacking.</p>

    <section aria-labelledby="comparison-options">
      <h2 id="comparison-options">Two elevation specimens</h2>

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
