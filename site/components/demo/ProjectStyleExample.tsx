import DemoConfiguredExample from './DemoConfiguredExample'
import { projectStyleExample, type ProjectStyleName } from './project-style-examples'

export default function ProjectStyleExample({ name, code = true, previewFirst = false }: { name: ProjectStyleName, code?: boolean, previewFirst?: boolean }) {
  return <DemoConfiguredExample name={name} {...projectStyleExample(name)} code={code} previewFirst={previewFirst} />
}
