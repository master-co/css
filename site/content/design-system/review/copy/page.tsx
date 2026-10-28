import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'
import ColorPalette from '~/site/docs-shell/components/ColorPalette'

import AppearanceControl from '../../components/AppearanceControl'
import Demo from '~/site/components/demo/Demo'
import DemoCopyButton from '~/site/components/demo/DemoCopyButton'
import './page.css'

export { metadata }

const token = 'var(--color-blue-60)'

const options = [
  {
    number: '01', note: 'The same behavior gains an explicit copy icon, tighter type, a precise border and a more readable result line.',
    preview: <Demo><DemoCopyButton value={token} label="Copy blue token">Copy blue token</DemoCopyButton></Demo>
  }
] as const

export default function Page() {
  return <main className="ds-component-page review-copy-review">
    <ReviewNavigation />
    <h1>Demo copy button</h1>
    <p className="review-copy-intro">The same behavior gains an explicit copy icon, tighter type, a precise border and a more readable result line.</p>

    <AppearanceControl label="Preview theme" />

    <section aria-labelledby="copy-options">
      <h2 id="copy-options">Copy one color reference</h2>

      <div className="review-copy-options">
        {options.map(({ number, note, preview }) => <article className="review-copy-option" key={number}>
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
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
