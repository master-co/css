import ProjectStyleExample from '~/site/components/demo/ProjectStyleExample'
import { projectStyleExamples, type ProjectStyleName } from '~/site/components/demo/project-style-examples'

export default function ProjectStyleRecipes() {
  return <div className="display:grid gap-xl">
    {(Object.keys(projectStyleExamples) as ProjectStyleName[]).map(name => <div key={name}>
      <ProjectStyleExample name={name} code={false} />
      <a className="display:inline-block mt-sm font-size-sm fg-text-link" href={projectStyleExamples[name].guide} aria-label={`Read the lesson: ${projectStyleExamples[name].title}`}>Read the lesson →</a>
    </div>)}
  </div>
}
