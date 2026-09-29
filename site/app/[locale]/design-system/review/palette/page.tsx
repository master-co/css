import Link from 'next/link'
import ColorPalette from '~/site/docs-shell/components/ColorPalette'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import DemoPalette from '~/site/components/demo/DemoPalette'
import './page.css'

export const metadata = {
  title: 'Demo palette review',
  description: 'Current Demo palette and practical examples.'
}

const options = [
  {
    number: '01', title: 'Current', detail: 'Precise token gallery',
    note: 'The same values gain a 44px chip target, clearer family heading and a quieter in-flow copy result that does not cover other rows.',
    preview: <DemoPalette families={['blue']} />
  }
] as const

export default function Page() {
  return <main className="review-palette-review">
    <div className="review-palette-kicker">Design system · Component review 28</div>
    <h1>Demo palette</h1>
    <p className="review-palette-intro">The same values gain a 44px chip target, clearer family heading and a quieter in-flow copy result that does not cover other rows.</p>

    <label htmlFor="palette-review-theme" className="review-palette-themeControl"><span>Preview theme</span><span className="review-palette-themeSelect">Light · Dark · System<ThemeSelect id="palette-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="palette-options">
      <h2 id="palette-options">Blue token scale</h2>

      <div className="review-palette-options">
        {options.map(({ number, title, detail, note, preview }) => <article className="review-palette-option" key={number}>
          <div className="review-palette-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className="review-palette-optionPreview">{preview}</div>
          <p className="review-palette-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="palette-real-use">
      <div className="review-palette-sectionHeading">
        <div><h2 id="palette-real-use">Actual Guide palette</h2><p>The colors Guide keeps all families and its original swatch behavior.</p></div>
        <Link href="/guide/colors#default-color-palette">Open /guide/colors</Link>
      </div>
      <div className="review-palette-realGuide"><ColorPalette filterColors={['blue', 'violet']} /></div>
      <p className="review-palette-optionNote">The Design System palette is a separate inventory of CSS variable names. It does not replace the original Guide component.</p>
    </section>
  </main>
}
