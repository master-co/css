import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'

import ResizeZone from '~/site/docs-shell/components/ResizeZone'
import AppearanceControl from '../../components/AppearanceControl'
import Demo from '~/site/components/demo/Demo'
import DemoContainer from '~/site/components/demo/DemoContainer'
import { DemoIFrame } from '~/site/components/demo/DemoBrowser'
import './page.css'

export { metadata }

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
    number: '01', note: 'A subtle specimen bed and clearer separation between canvas, width slider, Fit and live measurement improve scanning without changing the query boundary.',
    preview: <Demo padding="none" frame="none"><DemoContainer title="Query card"><QuerySpecimen /></DemoContainer></Demo>
  }
] as const

export default function Page() {
  return <main className="ds-component-page review-container-review">
    <ReviewNavigation />
    <h1>Demo container</h1>
    <p className="review-container-intro">A subtle specimen bed and clearer separation between canvas, width slider, Fit and live measurement improve scanning without changing the query boundary.</p>

    <AppearanceControl label="Preview theme" />

    <section aria-labelledby="container-options">
      <h2 id="container-options">Change the query boundary</h2>

      <div className="review-container-options">
        {options.map(({ number, note, preview }) => <article className="review-container-option" key={number}>
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
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
