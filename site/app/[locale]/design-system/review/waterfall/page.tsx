import Link from 'next/link'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import GuideResourceWaterfall from '~/site/app/[locale]/guide/preload-critical-resources/components/ResourceWaterfall'
import DemoWaterfall from '~/site/components/demo/DemoWaterfall'
import { resourceWaterfalls } from '~/site/utils/first-paint-examples'
import './page.css'

export const metadata = {
  title: 'Demo waterfall review',
  description: 'Compare the original Guide timeline with the shared request-order diagram and a refined candidate.'
}

const sample = resourceWaterfalls[0]

const options = [
  {
    number: '01', title: 'Original Guide', detail: 'Detailed preload timeline',
    note: 'The original Guide uses labeled phases, resource colors and an illustrative FCP line to explain its specific preload example. It stays in the Guide.',
    preview: <div className="review-waterfall-original"><GuideResourceWaterfall /></div>
  },
  {
    number: '02', title: 'Current', detail: 'Shared request-order diagram',
    note: 'The newer Design System diagram uses simple intervals and two accent roles for conceptual discovery order without implying measured duration.',
    preview: <div className="review-waterfall-previous"><DemoWaterfall {...sample} /></div>
  },
  {
    number: '03', title: 'Adopted', detail: 'Clearer row hierarchy',
    note: 'The same diagram gives resource names and the order axis more presence, separates the axis from the tracks and increases the bar target height on narrow screens.',
    preview: <DemoWaterfall {...sample} />
  }
] as const

export default function Page() {
  return <main className="review-waterfall-review">
    <div className="review-waterfall-kicker">Design system · Component review 29</div>
    <h1>Demo waterfall</h1>
    <p className="review-waterfall-intro">The Guide already has a strong, purpose-built preload timeline. This review concerns the lighter shared diagram for illustrating discovery order in Design System examples, where no network duration or FCP measurement is claimed.</p>
    <div className="review-waterfall-reviewNote" role="note">The refined shared diagram is adopted. The original Guide timeline remains in its lesson.</div>
    <label htmlFor="waterfall-review-theme" className="review-waterfall-themeControl"><span>Preview theme</span><span className="review-waterfall-themeSelect">Light · Dark · System<ThemeSelect id="waterfall-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="waterfall-options">
      <h2 id="waterfall-options">Request-order treatments</h2>
      <p className="review-waterfall-sectionCopy">All shared treatments use the same four resources. The Guide timeline has its own preload scenarios and illustrative FCP marker because it teaches that specific page-loading condition.</p>
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
