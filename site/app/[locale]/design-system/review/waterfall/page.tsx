import Link from 'next/link'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import GuideResourceWaterfall from '~/site/app/[locale]/guide/preload-critical-resources/components/ResourceWaterfall'
import DemoWaterfall from '~/site/components/demo/DemoWaterfall'
import { resourceWaterfalls } from '~/site/utils/first-paint-examples'
import './page.css'

export const metadata = {
  title: 'Demo waterfall review',
  description: 'Current Demo waterfall and practical examples.'
}

const sample = resourceWaterfalls[0]

const options = [
  {
    number: '01', title: 'Current', detail: 'Clearer row hierarchy',
    note: 'The same diagram gives resource names and the order axis more presence, separates the axis from the tracks and increases the bar target height on narrow screens.',
    preview: <DemoWaterfall {...sample} />
  }
] as const

export default function Page() {
  return <main className="review-waterfall-review">
    <div className="review-waterfall-kicker">Design system · Component review 29</div>
    <h1>Demo waterfall</h1>
    <p className="review-waterfall-intro">The same diagram gives resource names and the order axis more presence, separates the axis from the tracks and increases the bar target height on narrow screens.</p>

    <label htmlFor="waterfall-review-theme" className="review-waterfall-themeControl"><span>Preview theme</span><span className="review-waterfall-themeSelect">Light · Dark · System<ThemeSelect id="waterfall-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="waterfall-options">
      <h2 id="waterfall-options">Request-order treatments</h2>

      <div className="review-waterfall-options">
        {options.map(({ number, title, detail, note, preview }) => <article className="review-waterfall-option" key={number}>
          <div className="review-waterfall-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
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
      <p className="review-waterfall-optionNote">The generic Design System diagram describes order only. The Guide retains its richer, lesson-specific visual and accompanying text.</p>
    </section>
  </main>
}
