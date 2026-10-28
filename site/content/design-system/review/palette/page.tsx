import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'
import ColorPalette from '~/site/docs-shell/components/ColorPalette'
import AppearanceControl from '../../components/AppearanceControl'
import DemoPalette from '~/site/components/demo/DemoPalette'
import './page.css'

export { metadata }

const options = [
  {
    number: '01', note: 'The same values gain a 44px chip target, clearer family heading and a quieter in-flow copy result that does not cover other rows.',
    preview: <DemoPalette families={['blue']} />
  }
] as const

export default function Page() {
  return <main className="ds-component-page review-palette-review">
    <ReviewNavigation />
    <h1>Demo palette</h1>
    <p className="review-palette-intro">The same values gain a 44px chip target, clearer family heading and a quieter in-flow copy result that does not cover other rows.</p>

    <AppearanceControl label="Preview theme" />

    <section aria-labelledby="palette-options">
      <h2 id="palette-options">Blue token scale</h2>

      <div className="review-palette-options">
        {options.map(({ number, note, preview }) => <article className="review-palette-option" key={number}>
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
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
