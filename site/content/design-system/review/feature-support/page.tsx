import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import '~/site/styles/docs-shell/prose.css'
import Link from '~/site/docs-shell/components/Link'
import AppearanceControl from '../../components/AppearanceControl'
import DemoFeatureSupport from '~/site/components/demo/DemoFeatureSupport'
import ProjectStyleExample from '~/site/components/demo/ProjectStyleExample'
import './page.css'

export { metadata }

function SupportExamples() {
  return <div className="review-feature-support-supportExamples">
    <DemoFeatureSupport condition="(field-sizing: content)" />
    <DemoFeatureSupport condition="(not-a-css-property: value)" />
  </div>
}

const options = [
  {
    number: '01', note: 'The syntax stays readable, while a small status marker and steadier spacing distinguish recognized and unsupported queries without relying on color alone.',
    preview: <SupportExamples />
  }
] as const

export default function Page() {
  return <main className="ds-component-page review-feature-support-review">
    <ReviewNavigation />
    <h1>Platform behavior</h1>
    <p className="review-feature-support-intro">The syntax stays readable, while a small status marker and steadier spacing distinguish recognized and unsupported queries without relying on color alone.</p>

    <AppearanceControl label="Preview theme" />

    <section aria-labelledby="support-options">
      <h2 id="support-options">Syntax checks</h2>

      <div className="review-feature-support-options">
        {options.map(({ number, note, preview }) => <article className="review-feature-support-option" key={number}>
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
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
