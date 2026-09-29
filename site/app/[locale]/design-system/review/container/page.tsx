import Link from 'next/link'

import ResizeZone from '~/site/docs-shell/components/ResizeZone'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import Demo from '~/site/components/demo/Demo'
import DemoContainer from '~/site/components/demo/DemoContainer'
import { DemoIFrame } from '~/site/components/demo/DemoBrowser'
import './page.css'

export const metadata = {
  title: 'Demo container review',
  description: 'Current Demo container and practical examples.'
}

function QuerySpecimen() {
  return <section className="overflow:hidden container-type:inline-size width:100% r-lg border-width:1px border-style:solid b-line-divider bg-surface-raised">
    <div className="display:flex flex-direction:column@container((width<=18rem))">
      <div className="flex:1 p-md bg-surface-inset"><strong>Media</strong><p className="review-container-specimenCopy">A visual region</p></div>
      <div className="flex:1 p-md"><strong>Content</strong><p className="review-container-specimenCopy">Stacks when this wrapper narrows.</p></div>
    </div>
  </section>
}

const options = [
  {
    number: '01', title: 'Current', detail: 'Framed container workspace',
    note: 'A subtle specimen bed and clearer separation between canvas, width slider, Fit and live measurement improve scanning without changing the query boundary.',
    preview: <Demo padding="none"><DemoContainer title="Query card"><QuerySpecimen /></DemoContainer></Demo>
  }
] as const

export default function Page() {
  return <main className="review-container-review">
    <div className="review-container-kicker">Design system · Component review 27</div>
    <h1>Demo container</h1>
    <p className="review-container-intro">A subtle specimen bed and clearer separation between canvas, width slider, Fit and live measurement improve scanning without changing the query boundary.</p>

    <label htmlFor="container-review-theme" className="review-container-themeControl"><span>Preview theme</span><span className="review-container-themeSelect">Light · Dark · System<ThemeSelect id="container-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="container-options">
      <h2 id="container-options">Change the query boundary</h2>

      <div className="review-container-options">
        {options.map(({ number, title, detail, note, preview }) => <article className="review-container-option" key={number}>
          <div className="review-container-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className="review-container-optionPreview">{preview}</div>
          <p className="review-container-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="container-real-use">
      <div className="review-container-sectionHeading">
        <div><h2 id="container-real-use">Actual Guide use</h2><p>The responsive-design guide retains its original draggable viewport example and visible ruler.</p></div>
        <Link href="/guide/responsive-design#based-on-container-sizes">Open /guide/responsive-design</Link>
      </div>
      <div className="review-container-realGuide"><ResizeZone width="100%" originX="center" showRuler><DemoIFrame src="/examples/responsive-gallery" height={360} /></ResizeZone></div>
      <p className="review-container-optionNote">The Guide iframe demonstrates viewport changes. The shared container control above changes only a wrapper, so the page viewport remains fixed.</p>
    </section>
  </main>
}
