import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'
import Demo from '~/site/components/demo/Demo'
import { DemoSwatch } from '~/site/components/demo'
import './page.css'

export { metadata }

export default function Page() {
  return (
    <main className="ds-component-page review-swatch-review">
      <ReviewNavigation />
      <h1>Demo swatch</h1>
      <p className="review-swatch-intro">The shared swatch pairs a color chip with a visible semantic label and token. It is a static inventory tile; use a button when copying a value.</p>

      <section aria-labelledby="swatch-current">
        <h2 id="swatch-current">One blue specimen</h2>
        <div className="review-swatch-current">
          <article className="review-swatch-option">
            <Demo><div className="review-swatch-swatchStage"><DemoSwatch label="Subject" value="--color-demo-blue" className="bg-demo-blue" /></div></Demo>
            <p className="review-swatch-optionNote">The token and semantic role share a restrained frame; the chip keeps a hairline edge.</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="swatch-roles">
        <h2 id="swatch-roles">Semantic roles in both themes</h2>
        <p className="review-swatch-sectionCopy">Pale surfaces need a boundary as much as saturated colors do. The labels remain text, never color alone.</p>
        <Demo>
          <div className="review-swatch-roleGrid">
            <DemoSwatch label="Canvas" value="demo-canvas" className="bg-demo-canvas" />
            <DemoSwatch label="Surface" value="demo-surface" className="bg-demo-surface" />
            <DemoSwatch label="Subject" value="demo-blue" className="bg-demo-blue" />
            <DemoSwatch label="Comparison" value="demo-violet" className="bg-demo-violet" />
          </div>
        </Demo>
        <p className="review-swatch-optionNote">The tile introduces no focus stop. For copying a color, retain the Guide palette or use a native button with an explicit name.</p>
      </section>

      <section aria-labelledby="swatch-real-use">
        <div className="review-swatch-sectionHeading">
          <div><h2 id="swatch-real-use">Role inventory</h2><p>Each color is identified by text as well as paint.</p></div>
          <Link href="/guide/colors#default-color-palette">Open /guide/colors</Link>
        </div>
        <div className="review-swatch-actualUse">
          <div><span>Shared role inventory</span><Demo><div className="review-swatch-currentRoleRow">{(['Canvas', 'Surface', 'Subject', 'Comparison'] as const).map((label, index) => <DemoSwatch key={label} label={label} className={['bg-demo-canvas', 'bg-demo-surface', 'bg-demo-blue', 'bg-demo-violet'][index]} />)}</div></Demo></div>
        </div>
        <p className="review-swatch-optionNote">The shared tile names roles in Design System and scenario explanations. The Guide palette provides the separate copy action.</p>
      </section>
    <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
  )
}
