import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import Code from '~/site/docs-shell/components/Code'
import StepSection, { Step, StepL, StepR } from '~/site/docs-shell/components/StepSection'

export { metadata }

export default function Page() {
  return <ComponentPage kicker="Documents" title="Steps" description="Each action beside its explanation and complete code; the numbered rail follows reading order." sections={[
    { id: 'sequence', title: 'Installation sequence', children: <StepSection>
      <Step $row>
        <StepL><h3>Create a project</h3><p>Start from a Vite project when you do not have an app yet.</p></StepL>
        <StepR><Code lang="sh" copyable={false}>{'npm create vite@latest my-app\ncd my-app'}</Code></StepR>
      </Step>
      <Step $row>
        <StepL><h3>Add Master CSS</h3><p>Run the installer from the project root.</p></StepL>
        <StepR><Code lang="sh" copyable={false}>npm create @master/css@rc -- --yes</Code></StepR>
      </Step>
      <Step $row>
        <StepL><h3>Run and style</h3><p>Start the dev server, then use Master CSS classes in your markup.</p></StepL>
        <StepR><Code lang="sh" copyable={false}>npm run dev</Code></StepR>
      </Step>
    </StepSection> },
  ]} usage={{ href: '/guide/installation', label: 'the installation guides' }} Documentation={ComponentDocumentation} />
}
