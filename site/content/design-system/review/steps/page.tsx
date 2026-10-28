import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'
import Code from '~/site/docs-shell/components/Code'
import StepSection, { Step, StepL, StepNum, StepR } from '~/site/docs-shell/components/StepSection'
import './page.css'

export { metadata }

function GuideSequence() {
  return <StepSection>
    <Step $row>
      <StepL><h3><StepNum />Create a project</h3><p>Start from a Vite project when you do not have an app yet.</p></StepL>
      <StepR><Code lang="sh" copyable={false}>{'npm create vite@latest my-app\ncd my-app'}</Code></StepR>
    </Step>
    <Step $row>
      <StepL><h3><StepNum />Add Master CSS</h3><p>Run the installer from the project root.</p></StepL>
      <StepR><Code lang="sh" copyable={false}>npm create @master/css@rc -- --yes</Code></StepR>
    </Step>
    <Step $row>
      <StepL><h3><StepNum />Run and style</h3><p>Start the dev server, then use Master CSS classes in your markup.</p></StepL>
      <StepR><Code lang="sh" copyable={false}>npm run dev</Code></StepR>
    </Step>
  </StepSection>
}

export default function Page() {
  return <main className="ds-component-page review-steps-review">
    <ReviewNavigation />
    <h1>Document steps</h1>
    <p>Pair each action with its explanation and complete code. The numbered rail follows the reading order, and columns respond to the space available inside the document.</p>

    <section aria-labelledby="steps-options">
      <h2 id="steps-options">Installation sequence</h2>
      <div className="review-steps-guideSequence"><GuideSequence /></div>
    </section>

    <section aria-labelledby="steps-real-use">
      <div className="review-steps-sectionHeading">
        <div><h2 id="steps-real-use">Used in Guide</h2><p>The installation guides use this same StepSection and code window.</p></div>
        <Link href="/guide/installation">Open the installation guide</Link>
      </div>
      <p className="review-steps-optionNote">Keep the complete explanation and expected result beside each action. The component supplies the sequence cue; the lesson supplies its content.</p>
    </section>
    <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
  </main>
}
