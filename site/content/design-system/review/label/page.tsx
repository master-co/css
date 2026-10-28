import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'

import Demo from '~/site/components/demo/Demo'
import { DemoLabel, DemoSurface } from '~/site/components/demo'
import { ShadowScaleDemo } from '~/site/content/guide/elevation/components/ShadowTokens'
import './page.css'

export { metadata }

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
    number: '01', note: 'A slightly larger, weight-balanced mono label with tabular numerals and explicit wrapping; spacing remains with the scene.',
    preview: <Demo><Specimen Label={DemoLabel} /></Demo>
  }
] as const

export default function Page() {
  return <main className="ds-component-page review-label-review">
    <ReviewNavigation />
    <h1>Demo label</h1>
    <p className="review-label-intro">A slightly larger, weight-balanced mono label with tabular numerals and explicit wrapping; spacing remains with the scene.</p>

    <section aria-labelledby="label-options">
      <h2 id="label-options">Class and metadata labels</h2>

      <div className="review-label-options">
        {options.map(({ number, note, preview }) => <article className="review-label-option" key={number}>
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
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
