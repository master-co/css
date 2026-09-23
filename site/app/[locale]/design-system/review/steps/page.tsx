import Link from 'next/link'
import StepSection, { Step, StepL, StepNum, StepR } from 'internal/components/StepSection'
import { DocumentStep, DocumentStepBody, DocumentStepNumber, DocumentSteps, DocumentStepText } from '~/site/components/DocumentSteps'
import styles from './page.module.css'

export const metadata = {
  title: 'Document steps review',
  description: 'The original Guide sequence, the current shared steps, and a refined timeline candidate.'
}

function CodeExample({ children }: { children: string }) {
  return <pre className={styles.code}><code>{children}</code></pre>
}

function GuideSequence({ full = false }: { full?: boolean }) {
  return <StepSection>
    <Step $row><StepL><h3><StepNum />Create a project</h3><p>Start from a Vite project when you do not have an app yet.</p></StepL><StepR><CodeExample>{'npm create vite@latest my-app\ncd my-app'}</CodeExample></StepR></Step>
    <Step $row><StepL><h3><StepNum />Add Master CSS</h3><p>Run the installer from the project root.</p></StepL><StepR><CodeExample>npm create @master/css@rc -- --yes</CodeExample></StepR></Step>
    {full && <Step $row><StepL><h3><StepNum />Run and style</h3><p>Start the dev server, then use Master CSS classes in your markup.</p></StepL><StepR><CodeExample>dev</CodeExample></StepR></Step>}
  </StepSection>
}

function SharedSequence() {
  return <DocumentSteps>
    <DocumentStep columns>
      <DocumentStepText><h3><DocumentStepNumber />Create a project</h3><p>Start from a Vite project when you do not have an app yet.</p></DocumentStepText>
      <DocumentStepBody><CodeExample>{'npm create vite@latest my-app\ncd my-app'}</CodeExample></DocumentStepBody>
    </DocumentStep>
    <DocumentStep columns>
      <DocumentStepText><h3><DocumentStepNumber />Add Master CSS</h3><p>Run the installer from the project root.</p></DocumentStepText>
      <DocumentStepBody><CodeExample>npm create @master/css@rc -- --yes</CodeExample></DocumentStepBody>
    </DocumentStep>
  </DocumentSteps>
}

const options = [
  { number: '01', title: 'Original Guide', detail: 'Continuous numbered rail', className: styles.original, preview: <GuideSequence />, note: 'The original installation Guide uses a light vertical rule, compact numbers and paired instructions and code. This remains in the published Guide.' },
  { number: '02', title: 'Current', detail: 'Shared horizontal dividers', className: styles.current, preview: <SharedSequence />, note: 'The shared DocumentSteps component uses full-width dividers and a two-digit number. Its content order already stacks correctly when narrow.' },
  { number: '03', title: 'Adopted', detail: 'Refined continuous rail', className: styles.candidate, preview: <SharedSequence />, note: 'The adopted shared style keeps the original Guide’s sequential line while using clearer headings, breathing room and a quieter number.' }
] as const

export default function Page() {
  return <main className={styles.review}>
    <div className={styles.kicker}>Design system · Component review 17</div>
    <h1>Document steps</h1>
    <p className={styles.intro}>The Guide’s installation sequence already has an effective visual rhythm. The candidate brings that numbered rail into the site-owned shared steps while retaining authored headings, responsive columns and code reading order.</p>
    <div className={styles.reviewNote} role="note">Adopted shared style: <code>DocumentSteps</code> now has the refined numbered rail. The published Guide still uses its original <code>StepSection</code> structure.</div>

    <section aria-labelledby="steps-options">
      <h2 id="steps-options">Sequence treatments</h2>
      <p className={styles.sectionCopy}>All three variants use the same first two installation actions and have a narrow document-column width.</p>
      <div className={styles.options}>{options.map(({ number, title, detail, className, preview, note }) => <article className={styles.option} key={number}>
        <div className={styles.optionHeading}><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
        <div className={`${styles.optionPreview} ${className}`}>{preview}</div>
        <p className={styles.optionNote}>{note}</p>
      </article>)}</div>
    </section>

    <section aria-labelledby="steps-real-use">
      <div className={styles.sectionHeading}>
        <div><h2 id="steps-real-use">Actual Guide use</h2><p>The installation page’s three-step sequence stays in its original structure.</p></div>
        <Link href="/guide/installation">Open /guide/installation</Link>
      </div>
      <div className={`${styles.optionPreview} ${styles.original}`}><GuideSequence full /></div>
      <p className={styles.optionNote}>The excerpt keeps the Guide’s action order and paired code. The live page also contains the complete explanation and next steps.</p>
    </section>
  </main>
}
