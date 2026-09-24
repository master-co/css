import Link from 'next/link'
import OriginalDemo from '~/site/docs-shell/components/Demo'
import IFrame from '~/site/docs-shell/components/IFrame'
import ResizeZone from '~/site/docs-shell/components/ResizeZone'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import Demo from '~/site/components/demo/Demo'
import DemoContainer from '~/site/components/demo/DemoContainer'
import styles from './page.module.css'

export const metadata = {
  title: 'Demo container review',
  description: 'Original Guide resize zone, current container control and a refined candidate.'
}

function QuerySpecimen() {
  return <section className="overflow:hidden container w:100% b:1px|solid|var(--color-line-base) r-lg surface-raised">
    <div className="flex flex-col@container(<=2xs)">
      <div className="flex:1 p-md surface-muted"><strong>Media</strong><p className={styles.specimenCopy}>A visual region</p></div>
      <div className="flex:1 p-md"><strong>Content</strong><p className={styles.specimenCopy}>Stacks when this wrapper narrows.</p></div>
    </div>
  </section>
}

const options = [
  {
    number: '01', title: 'Original Guide', detail: 'Drag-to-resize zone',
    note: 'The original responsive Guide keeps its edge handles and breakpoint ruler; that page is unchanged.',
    preview: <ResizeZone width="100%" originX="center" showRuler><OriginalDemo><QuerySpecimen /></OriginalDemo></ResizeZone>
  },
  {
    number: '02', title: 'Previous', detail: 'Earlier shared real-width control',
    note: 'A native range changes the actual wrapper width. The status reports its measured size, and Fit restores available space.',
    preview: <div className={styles.previous}><Demo padding="none"><DemoContainer title="Query card"><QuerySpecimen /></DemoContainer></Demo></div>
  },
  {
    number: '03', title: 'Adopted', detail: 'Framed container workspace',
    note: 'A subtle specimen bed and clearer separation between canvas, width slider, Fit and live measurement improve scanning without changing the query boundary.',
    preview: <Demo padding="none"><DemoContainer title="Query card"><QuerySpecimen /></DemoContainer></Demo>
  }
] as const

export default function Page() {
  return <main className={styles.review}>
    <div className={styles.kicker}>Design system · Component review 27</div>
    <h1>Demo container</h1>
    <p className={styles.intro}>Container queries respond to the width of a real element. The adopted workspace frames that element and keeps the slider, Fit action and live measurement outside the test layout.</p>
    <div className={styles.reviewNote} role="note">Adopted direction: the shared container control has a clearer specimen bed and measurements. The original Guide resize zone is unchanged.</div>
    <label htmlFor="container-review-theme" className={styles.themeControl}><span>Preview theme</span><span className={styles.themeSelect}>Light · Dark · System<ThemeSelect id="container-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="container-options">
      <h2 id="container-options">Change the query boundary</h2>
      <p className={styles.sectionCopy}>Shrink each specimen past the <code>2xs</code> container threshold. The child switches direction through the same <code>flex-col@container(&lt;=2xs)</code> class in all three versions.</p>
      <div className={styles.options}>
        {options.map(({ number, title, detail, note, preview }) => <article className={styles.option} key={number}>
          <div className={styles.optionHeading}><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className={styles.optionPreview}>{preview}</div>
          <p className={styles.optionNote}>{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="container-real-use">
      <div className={styles.sectionHeading}>
        <div><h2 id="container-real-use">Actual Guide use</h2><p>The responsive-design guide retains its original draggable viewport example and visible ruler.</p></div>
        <Link href="/guide/responsive-design#based-on-container-sizes">Open /guide/responsive-design</Link>
      </div>
      <div className={styles.realGuide}><ResizeZone width="100%" originX="center" showRuler><IFrame src="/examples/responsive-gallery" height={360} /></ResizeZone></div>
      <p className={styles.optionNote}>The Guide iframe demonstrates viewport changes. The shared container control above changes only a wrapper, so the page viewport remains fixed.</p>
    </section>
  </main>
}
