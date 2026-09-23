import Link from 'next/link'
import OriginalDemo from 'internal/components/Demo'
import OriginalDemoPanel from 'internal/components/DemoPanel'
import Demo from '~/site/components/demo/Demo'
import { DemoItem, DemoSurface, DemoText } from '~/site/components/demo'
import DemoSurfaceCandidate from './DemoSurfaceCandidate'
import styles from './page.module.css'

export const metadata = {
  title: 'Demo surface review',
  description: 'Review-only comparison of the original Guide panel, current surface and refined surface candidate.'
}

function content() {
  return <><span className={styles.eyebrow}>COLLECTION / 024</span><div className={styles.cardTitle}>Field notes</div><p className={styles.cardCopy}>A stable backdrop for the object and its supporting text.</p></>
}

function ReferenceExample({ candidate }: { candidate: boolean }) {
  const Surface = candidate ? DemoSurfaceCandidate : DemoSurface
  return (
    <Demo title="Column span" caption="The surface contains real columns. Padding and columns belong to the lesson.">
      <Surface className="p:md font:sm">
        <div className="gap:md columns:2">
          <DemoText className="mx:0 mb:sm mt:0">Start with the collection overview and its key details.</DemoText>
          <DemoItem tone="blue" className="my:sm p:sm font:medium">Collection notes</DemoItem>
          <DemoText className="m:0">Continue through each column in reading order, then move to the next section.</DemoText>
        </div>
      </Surface>
    </Demo>
  )
}

export default function Page() {
  return (
    <main className={styles.review}>
      <div className={styles.kicker}>Design system · Component review 06</div>
      <h1>Demo surface</h1>
      <p className={styles.intro}>The original Guide panel has a raised surface and restrained shadow. The shared surface should keep that sense of hierarchy available without adding padding, layout, clipping or elevation to a measured lesson by default.</p>
      <div className={styles.reviewNote} role="note">Review scope: <code>DemoSurface</code> paint. The proposed default is a fine bordered surface; <code>elevation=&quot;raised&quot;</code> deliberately recalls the original panel shadow. Geometry remains owned by the example.</div>

      <section aria-labelledby="surface-comparison">
        <h2 id="surface-comparison">Basic content panel</h2>
        <div className={styles.comparison}>
          <article className={styles.option}>
            <div className={styles.optionHeading}><span>01</span><div><h3>Original Guide</h3><p><code>app-panel</code></p></div></div>
            <OriginalDemo><div className={styles.surfaceStage}><OriginalDemoPanel $p={0} className="p:md">{content()}</OriginalDemoPanel></div></OriginalDemo>
            <p className={styles.optionNote}>Raised fill and soft shadow; padding here is supplied by the specimen.</p>
          </article>
          <article className={styles.option}>
            <div className={styles.optionHeading}><span>02</span><div><h3>Current</h3><p>Shared <code>DemoSurface</code></p></div></div>
            <Demo><div className={styles.surfaceStage}><DemoSurface className="p:md">{content()}</DemoSurface></div></Demo>
            <p className={styles.optionNote}>Raised fill with a subtle edge, but no layered option.</p>
          </article>
          <article className={styles.option}>
            <div className={styles.optionHeading}><span>03</span><div><h3>Candidate</h3><p>Review-only surface</p></div></div>
            <Demo><div className={styles.surfaceStage}><DemoSurfaceCandidate elevation="raised" className="p:md">{content()}</DemoSurfaceCandidate></div></Demo>
            <p className={styles.optionNote}>A precise edge, compact radius and opt-in shadow for a genuinely raised layer.</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="surface-variants">
        <h2 id="surface-variants">Flat and raised treatments</h2>
        <p className={styles.sectionCopy}>The two treatments share the same dimensions. Elevation is used only where stacking is part of the explanation.</p>
        <Demo>
          <div className={styles.treatmentGrid}>
            <div><span className={styles.pairLabel}>Default · no elevation</span><DemoSurfaceCandidate className="p:md"><div className={styles.cardTitle}>Layout surface</div><p className={styles.cardCopy}>Keeps an example legible without implying a floating layer.</p></DemoSurfaceCandidate></div>
            <div><span className={styles.pairLabel}>Raised · explicit elevation</span><DemoSurfaceCandidate elevation="raised" className="p:md"><div className={styles.cardTitle}>Floating layer</div><p className={styles.cardCopy}>Shows a stacked panel when depth is actually relevant.</p></DemoSurfaceCandidate></div>
          </div>
        </Demo>
        <p className={styles.optionNote}>Use explicit classes for padding, flex/grid, dimensions, position and overflow. The raised treatment adds visual shadow only.</p>
      </section>

      <section aria-labelledby="surface-real-use">
        <div className={styles.sectionHeading}>
          <div><h2 id="surface-real-use">Actual Reference use</h2><p>The surface must not become an extra column or change the content box.</p></div>
          <Link href="/reference/column-span">Open /reference/column-span</Link>
        </div>
        <div className={styles.actualPair}>
          <div><span className={styles.pairLabel}>Current surface</span><ReferenceExample candidate={false} /></div>
          <div><span className={styles.pairLabel}>Candidate surface</span><ReferenceExample candidate /></div>
        </div>
      </section>
    </main>
  )
}
