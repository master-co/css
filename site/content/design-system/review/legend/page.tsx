import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'

import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import { DemoLegend } from '~/site/components/demo'
import './page.css'

export { metadata }

const items = [
  { tone: 'blue', label: 'Subject border' },
  { tone: 'violet', label: 'Comparison border' }
] as const

function BorderSpecimens() {
  return <div className="review-legend-specimens">
    <div className={`b-blue border-style:solid border-width:2px bg-surface-raised review-legend-specimen`}>Subject</div>
    <div className={`b-violet border-style:solid border-width:2px bg-surface-raised review-legend-specimen`}>Comparison</div>
  </div>
}

const options = [
  {
    number: '01', note: 'Slightly larger monospace labels and precise bordered swatches improve scanning while keeping the key outside the scene.',
    preview: <Demo caption={<DemoLegend items={[...items]} />}><BorderSpecimens /></Demo>
  }
] as const

export default function Page() {
  return <main className="ds-component-page review-legend-review">
    <ReviewNavigation />
    <h1>Demo legend</h1>
    <p className="review-legend-intro">Slightly larger monospace labels and precise bordered swatches improve scanning while keeping the key outside the scene.</p>

    <section aria-labelledby="legend-options">
      <h2 id="legend-options">Border color comparison</h2>

      <div className="review-legend-options">
        {options.map(({ number, note, preview }) => <article className="review-legend-option" key={number}>
          <div className="review-legend-optionPreview">{preview}</div>
          <p className="review-legend-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="legend-real-use">
      <div className="review-legend-sectionHeading">
        <div><h2 id="legend-real-use">Actual Reference use</h2><p>The border-color reference compares the same border width and style in blue and violet.</p></div>
        <Link href="/reference/tokens/color">Open /reference/tokens/color</Link>
      </div>
      <DemoExample page="border-color" section="set-border-color" />
      <p className="review-legend-optionNote">The Reference retains its own caption and code comments. A legend is useful when a scene repeats these roles, and its text must carry the meaning without relying on color alone.</p>
    </section>
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
