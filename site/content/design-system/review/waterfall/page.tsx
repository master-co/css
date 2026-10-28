import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'
import AppearanceControl from '../../components/AppearanceControl'
import GuideResourceWaterfall from '~/site/components/demo/ResourceWaterfall'
import DemoWaterfall from '~/site/components/demo/DemoWaterfall'
import { resourceWaterfalls } from '~/site/utils/first-paint-examples'
import './page.css'

export { metadata }

const sample = resourceWaterfalls[0]

const options = [
  {
    number: '01', note: 'The same diagram gives resource names and the order axis more presence, separates the axis from the tracks and increases the bar target height on narrow screens.',
    preview: <DemoWaterfall {...sample} />
  }
] as const

export default function Page() {
  return <main className="ds-component-page review-waterfall-review">
    <ReviewNavigation />
    <h1>Demo waterfall</h1>
    <p className="review-waterfall-intro">The same diagram gives resource names and the order axis more presence, separates the axis from the tracks and increases the bar target height on narrow screens.</p>

    <AppearanceControl label="Preview theme" />

    <section aria-labelledby="waterfall-options">
      <h2 id="waterfall-options">Request-order treatments</h2>

      <div className="review-waterfall-options">
        {options.map(({ number, note, preview }) => <article className="review-waterfall-option" key={number}>
          <div className="review-waterfall-optionPreview">{preview}</div>
          <p className="review-waterfall-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="waterfall-real-use">
      <div className="review-waterfall-sectionHeading">
        <div><h2 id="waterfall-real-use">Actual Guide use</h2><p>The published preload lesson keeps its resource phases and FCP condition.</p></div>
        <Link href="/guide/preload-critical-resources#preload-runtime-engine">Open /guide/preload-critical-resources</Link>
      </div>
      <div className="review-waterfall-realGuide"><GuideResourceWaterfall /></div>
      <p className="review-waterfall-optionNote">Guide and Design System share the request-order diagram and its source data. The first-paint marker is illustrative.</p>
    </section>
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
