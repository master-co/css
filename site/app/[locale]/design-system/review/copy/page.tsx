import Link from 'next/link'
import ColorPalette from '~/site/docs-shell/components/ColorPalette'

import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import Demo from '~/site/components/demo/Demo'
import DemoCopyButton from '~/site/components/demo/DemoCopyButton'
import './page.css'

export const metadata = {
  title: 'Demo copy control review',
  description: 'Current Demo copy button and practical examples.'
}

const token = 'var(--color-blue-60)'

const options = [
  {
    number: '01', title: 'Current', detail: 'Tool-like copy control',
    note: 'The same behavior gains an explicit copy icon, tighter type, a precise border and a more readable result line.',
    preview: <Demo><DemoCopyButton value={token} label="Copy blue token">Copy blue token</DemoCopyButton></Demo>
  }
] as const

export default function Page() {
  return <main className="review-copy-review">
    <div className="review-copy-kicker">Design system · Component review 26</div>
    <h1>Demo copy button</h1>
    <p className="review-copy-intro">The same behavior gains an explicit copy icon, tighter type, a precise border and a more readable result line.</p>

    <label htmlFor="copy-review-theme" className="review-copy-themeControl"><span>Preview theme</span><span className="review-copy-themeSelect">Light · Dark · System<ThemeSelect id="copy-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="copy-options">
      <h2 id="copy-options">Copy one color reference</h2>

      <div className="review-copy-options">
        {options.map(({ number, title, detail, note, preview }) => <article className="review-copy-option" key={number}>
          <div className="review-copy-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className="review-copy-optionPreview">{preview}</div>
          <p className="review-copy-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="copy-real-use">
      <div className="review-copy-sectionHeading">
        <div><h2 id="copy-real-use">Actual Guide palette</h2><p>The colors guide retains its original interactive grid and native color values.</p></div>
        <Link href="/guide/colors#default-color-palette">Open /guide/colors</Link>
      </div>
      <div className="review-copy-guidePalette"><ColorPalette filterColors={['blue']} /></div>
      <p className="review-copy-optionNote">The Design System palette can copy variable references; the Guide palette continues to copy literal palette values.</p>
    </section>
  </main>
}
