import Link from 'next/link'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import DemoFeatureSupport from '~/site/components/demo/DemoFeatureSupport'
import ProjectStyleExample from '~/site/components/demo/ProjectStyleExample'
import styles from './page.module.css'

export const metadata = {
  title: 'Feature support review',
  description: 'Original Guide support guidance, current browser status and a refined candidate.'
}

function SupportExamples() {
  return <div className={styles.supportExamples}>
    <DemoFeatureSupport condition="(field-sizing: content)" />
    <DemoFeatureSupport condition="(not-a-css-property: value)" />
  </div>
}

const options = [
  {
    number: '01', title: 'Original Guide', detail: 'Support explained in prose',
    note: 'The Compatibility Guide explains that feature support comes from the generated CSS and advises a fallback for target browsers. That guidance remains the source of truth.',
    preview: <div className={styles.original}><p>Browser support depends on the final property, value, selector, at-rule, or platform feature. Check the feature and keep a fallback when the target browser may not support it.</p></div>
  },
  {
    number: '02', title: 'Current', detail: 'Browser syntax status',
    note: 'The live status tests CSS.supports in this browser. It reports syntax recognition, not that an entire interaction or platform behavior works.',
    preview: <div className={styles.previous}><SupportExamples /></div>
  },
  {
    number: '03', title: 'Adopted', detail: 'Compact status with explicit signal',
    note: 'The syntax stays readable, while a small status marker and steadier spacing distinguish recognized and unsupported queries without relying on color alone.',
    preview: <SupportExamples />
  }
] as const

export default function Page() {
  return <main className={styles.review}>
    <div className={styles.kicker}>Design system · Component review 31</div>
    <h1>Feature support</h1>
    <p className={styles.intro}>The Guide explains compatibility in context. A small Design System label can additionally report whether this browser parses a specific CSS feature query, while the adjacent example retains its real fallback.</p>
    <div className={styles.reviewNote} role="note">The refined shared support label is adopted. The Compatibility Guide keeps its original guidance.</div>
    <label htmlFor="support-review-theme" className={styles.themeControl}><span>Preview theme</span><span className={styles.themeSelect}>Light · Dark · System<ThemeSelect id="support-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="support-options">
      <h2 id="support-options">Support treatments</h2>
      <p className={styles.sectionCopy}>The second query is intentionally unsupported. Compare the text and marker in light and dark modes; the status is based on the current browser, not a server guess.</p>
      <div className={styles.options}>
        {options.map(({ number, title, detail, note, preview }) => <article className={styles.option} key={number}>
          <div className={styles.optionHeading}><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className={styles.optionPreview}>{preview}</div>
          <p className={styles.optionNote}>{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="support-real-use">
      <div className={styles.sectionHeading}>
        <div><h2 id="support-real-use">Actual Guide example</h2><p>A native property example uses the Guide rule: generated CSS is useful only when the target browser supports it.</p></div>
        <Link href="/guide/compatibility#browser-support">Open /guide/compatibility</Link>
      </div>
      <div className={styles.realGuide}><ProjectStyleExample name="nativeField" /></div>
      <p className={styles.optionNote}>This preview uses the same field-sizing example as the Design System. The Compatibility Guide keeps its original prose and generated-CSS explanation.</p>
    </section>
  </main>
}
