import Link from 'next/link'
import ColorPalette from '~/site/docs-shell/components/ColorPalette'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import DemoPalette from '~/site/components/demo/DemoPalette'
import styles from './page.module.css'

export const metadata = {
  title: 'Demo palette review',
  description: 'Original Guide palette, current preset palette and a refined candidate.'
}

const options = [
  {
    number: '01', title: 'Original Guide', detail: 'Fixed color-step grid',
    note: 'The Guide shows every fixed step with its original click-to-copy swatch and keeps this established UI.',
    preview: <div className={styles.original}><ColorPalette filterColors={['blue']} /></div>
  },
  {
    number: '02', title: 'Current', detail: 'Shared preset-variable palette',
    note: 'The newer gallery reads preset variables and copies their CSS variable references through native buttons.',
    preview: <div className={styles.previous}><DemoPalette families={['blue']} /></div>
  },
  {
    number: '03', title: 'Adopted', detail: 'Precise token gallery',
    note: 'The same values gain a 44px chip target, clearer family heading and a quieter in-flow copy result that does not cover other rows.',
    preview: <DemoPalette families={['blue']} />
  }
] as const

export default function Page() {
  return <main className={styles.review}>
    <div className={styles.kicker}>Design system · Component review 28</div>
    <h1>Demo palette</h1>
    <p className={styles.intro}>A color inventory needs a predictable reading order and precise copy targets. The candidate refines the Design System token gallery while keeping the Guide’s original fixed-color palette intact.</p>
    <div className={styles.reviewNote} role="note">The refined shared palette is adopted. The Guide palette keeps its original presentation.</div>
    <label htmlFor="palette-review-theme" className={styles.themeControl}><span>Preview theme</span><span className={styles.themeSelect}>Light · Dark · System<ThemeSelect id="palette-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="palette-options">
      <h2 id="palette-options">Blue token scale</h2>
      <p className={styles.sectionCopy}>All treatments show the same thirteen preset steps. The original copies the literal color; the shared palette copies <code>var(--color-blue-*)</code>, which is what its Design System usage documents.</p>
      <div className={styles.options}>
        {options.map(({ number, title, detail, note, preview }) => <article className={styles.option} key={number}>
          <div className={styles.optionHeading}><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className={styles.optionPreview}>{preview}</div>
          <p className={styles.optionNote}>{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="palette-real-use">
      <div className={styles.sectionHeading}>
        <div><h2 id="palette-real-use">Actual Guide palette</h2><p>The colors Guide keeps all families and its original swatch behavior.</p></div>
        <Link href="/guide/colors#default-color-palette">Open /guide/colors</Link>
      </div>
      <div className={styles.realGuide}><ColorPalette filterColors={['blue', 'violet']} /></div>
      <p className={styles.optionNote}>The Design System palette is a separate inventory of CSS variable names. It does not replace the original Guide component.</p>
    </section>
  </main>
}
