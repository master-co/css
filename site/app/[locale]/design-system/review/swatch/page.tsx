import Link from 'next/link'
import OriginalDemo from '~/site/docs-shell/components/Demo'
import OriginalPaletteItem from '~/site/docs-shell/components/ColorPaletteItem'
import { getColor } from '~/site/docs-shell/data/color-palette'
import Demo from '~/site/components/demo/Demo'
import { DemoSwatch } from '~/site/components/demo'
import styles from './page.module.css'

export const metadata = {
  title: 'Demo swatch review',
  description: 'Review-only comparison of original palette swatches, current demo swatch and labeled inventory candidate.'
}

const blue = getColor('blue', 60)

function PreviousSwatch() {
  return <div className={styles.swatchPrevious}><div className={`${styles.colorPrevious} bg-demo-blue`} /><span className="demo-label">Subject</span></div>
}

export default function Page() {
  return (
    <main className={styles.review}>
      <div className={styles.kicker}>Design system · Component review 05</div>
      <h1>Demo swatch</h1>
      <p className={styles.intro}>The Guide palette already gives each color a generous chip and a clear step. The shared swatch can reuse that precise feel while making a small semantic role inventory readable on the striped canvas.</p>
      <div className={styles.reviewNote} role="note">Approved direction: the static <code>DemoSwatch</code> is now a labeled inventory tile. The original Guide palette remains interactive and copies a value; the shared tile does not pretend to be a control. Its color still comes from an explicit utility class or inline style.</div>

      <section aria-labelledby="swatch-comparison">
        <h2 id="swatch-comparison">One blue specimen</h2>
        <div className={styles.comparison}>
          <article className={styles.option}>
            <div className={styles.optionHeading}><span>01</span><div><h3>Original Guide</h3><p>Palette step 60</p></div></div>
            <OriginalDemo><div className={styles.originalStage}><div className={styles.stepHead}>60</div><div className={styles.originalChip}><OriginalPaletteItem color={blue} level={60} colorName="blue" /></div></div></OriginalDemo>
            <p className={styles.optionNote}>Generous chip, subtle outline, numbered step and keyboard copy action.</p>
          </article>
          <article className={styles.option}>
            <div className={styles.optionHeading}><span>02</span><div><h3>Previous</h3><p>Plain <code>DemoSwatch</code></p></div></div>
            <Demo><div className={styles.swatchStage}><PreviousSwatch /></div></Demo>
            <p className={styles.optionNote}>The role has a label, but the chip and label have little visual relationship.</p>
          </article>
          <article className={styles.option}>
            <div className={styles.optionHeading}><span>03</span><div><h3>Adopted</h3><p>Shared inventory tile</p></div></div>
            <Demo><div className={styles.swatchStage}><DemoSwatch label="Subject" value="--color-demo-blue" className="bg-demo-blue" /></div></Demo>
            <p className={styles.optionNote}>The token and semantic role share a restrained frame; the chip keeps a hairline edge.</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="swatch-roles">
        <h2 id="swatch-roles">Semantic roles in both themes</h2>
        <p className={styles.sectionCopy}>Pale surfaces need a boundary as much as saturated colors do. The labels remain text, never color alone.</p>
        <Demo>
          <div className={styles.roleGrid}>
            <DemoSwatch label="Canvas" value="demo-canvas" className="bg-demo-canvas" />
            <DemoSwatch label="Surface" value="demo-surface" className="bg-demo-surface" />
            <DemoSwatch label="Subject" value="demo-blue" className="bg-demo-blue" />
            <DemoSwatch label="Comparison" value="demo-violet" className="bg-demo-violet" />
          </div>
        </Demo>
        <p className={styles.optionNote}>The tile introduces no focus stop. For copying a color, retain the Guide palette or use a native button with an explicit name.</p>
      </section>

      <section aria-labelledby="swatch-real-use">
        <div className={styles.sectionHeading}>
          <div><h2 id="swatch-real-use">Actual Guide use</h2><p>The original palette is preserved for browsing and copying fixed color steps.</p></div>
          <Link href="/guide/colors#default-color-palette">Open /guide/colors</Link>
        </div>
        <div className={styles.actualPair}>
          <div><span className={styles.pairLabel}>Guide palette</span><OriginalDemo><div className={styles.paletteStage}><div className={styles.stepHead}><span>40</span><span>50</span><span>60</span><span>70</span></div><div className={styles.originalRow}>{([40, 50, 60, 70] as const).map(level => <OriginalPaletteItem key={level} color={getColor('blue', level)} level={level} colorName="blue" />)}</div></div></OriginalDemo></div>
          <div><span className={styles.pairLabel}>Shared role inventory</span><Demo><div className={styles.candidateRow}>{(['Canvas', 'Surface', 'Subject', 'Comparison'] as const).map((label, index) => <DemoSwatch key={label} label={label} className={['bg-demo-canvas', 'bg-demo-surface', 'bg-demo-blue', 'bg-demo-violet'][index]} />)}</div></Demo></div>
        </div>
        <p className={styles.optionNote}>These have different jobs: the Guide retains a copyable fixed palette, while the shared tile names roles in Design System and scenario explanations.</p>
      </section>
    </main>
  )
}
