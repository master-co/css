import Link from 'next/link'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import DemoFeatureSupport from '~/site/components/demo/DemoFeatureSupport'
import ProjectStyleExample from '~/site/components/demo/ProjectStyleExample'
import './page.css'

export const metadata = {
  title: 'Feature support review',
  description: 'Current Feature support and practical examples.'
}

function SupportExamples() {
  return <div className="review-feature-support-supportExamples">
    <DemoFeatureSupport condition="(field-sizing: content)" />
    <DemoFeatureSupport condition="(not-a-css-property: value)" />
  </div>
}

const options = [
  {
    number: '01', title: 'Current', detail: 'Compact status with explicit signal',
    note: 'The syntax stays readable, while a small status marker and steadier spacing distinguish recognized and unsupported queries without relying on color alone.',
    preview: <SupportExamples />
  }
] as const

export default function Page() {
  return <main className="review-feature-support-review">
    <div className="review-feature-support-kicker">Design system · Component review 31</div>
    <h1>Feature support</h1>
    <p className="review-feature-support-intro">The syntax stays readable, while a small status marker and steadier spacing distinguish recognized and unsupported queries without relying on color alone.</p>

    <label htmlFor="support-review-theme" className="review-feature-support-themeControl"><span>Preview theme</span><span className="review-feature-support-themeSelect">Light · Dark · System<ThemeSelect id="support-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="support-options">
      <h2 id="support-options">Support treatments</h2>

      <div className="review-feature-support-options">
        {options.map(({ number, title, detail, note, preview }) => <article className="review-feature-support-option" key={number}>
          <div className="review-feature-support-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className="review-feature-support-optionPreview">{preview}</div>
          <p className="review-feature-support-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="support-real-use">
      <div className="review-feature-support-sectionHeading">
        <div><h2 id="support-real-use">Actual Guide example</h2><p>A native property example uses the Guide rule: generated CSS is useful only when the target browser supports it.</p></div>
        <Link href="/guide/compatibility#browser-support">Open /guide/compatibility</Link>
      </div>
      <div className="review-feature-support-realGuide"><ProjectStyleExample name="nativeField" /></div>
      <p className="review-feature-support-optionNote">This preview uses the same field-sizing example as the Design System. The Compatibility Guide keeps its original prose and generated-CSS explanation.</p>
    </section>
  </main>
}
