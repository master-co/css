import Link from 'next/link'
import ColorPalette from '~/site/docs-shell/components/ColorPalette'
import ColorPaletteItem from '~/site/docs-shell/components/ColorPaletteItem'
import { getColor } from '~/site/docs-shell/data/color-palette'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import Demo from '~/site/components/demo/Demo'
import DemoCopyButton from '~/site/components/demo/DemoCopyButton'
import './page.css'

export const metadata = {
  title: 'Demo copy control review',
  description: 'Original Guide swatch, current shared copy button and a refined candidate.'
}

const token = 'var(--color-blue-60)'

const options = [
  {
    number: '01', title: 'Original Guide', detail: 'Clickable color swatch',
    note: 'The Guide uses its original palette control to copy a fixed color value; it remains unchanged.',
    preview: <div className="review-copy-original"><ColorPaletteItem color={getColor('blue', 60)} colorName="blue" level={60} /><p>Click the swatch to copy its color.</p></div>
  },
  {
    number: '02', title: 'Previous', detail: 'Earlier shared text button',
    note: 'The current control uses a native button and announces the actual clipboard result below it.',
    preview: <div className="review-copy-previous"><Demo><DemoCopyButton value={token} label="Copy blue token" icon={null} className="demo-button">Copy blue token</DemoCopyButton></Demo></div>
  },
  {
    number: '03', title: 'Adopted', detail: 'Tool-like copy control',
    note: 'The same behavior gains an explicit copy icon, tighter type, a precise border and a more readable result line.',
    preview: <Demo><DemoCopyButton value={token} label="Copy blue token">Copy blue token</DemoCopyButton></Demo>
  }
] as const

export default function Page() {
  return <main className="review-copy-review">
    <div className="review-copy-kicker">Design system · Component review 26</div>
    <h1>Demo copy button</h1>
    <p className="review-copy-intro">Copy controls should state the value they copy and report whether the browser accepted the action. The adopted control keeps the native button and makes the action and status easier to scan.</p>
    <div className="review-copy-reviewNote" role="note">Adopted direction: shared text copy controls now have a clear icon, refined button and readable result. The Guide palette remains unchanged.</div>
    <label htmlFor="copy-review-theme" className="review-copy-themeControl"><span>Preview theme</span><span className="review-copy-themeSelect">Light · Dark · System<ThemeSelect id="copy-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="copy-options">
      <h2 id="copy-options">Copy one color reference</h2>
      <p className="review-copy-sectionCopy">Activate the current and candidate buttons with mouse or keyboard. A status line below each button reports the value or explains clipboard denial.</p>
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
