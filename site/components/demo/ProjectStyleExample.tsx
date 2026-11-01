import DemoConfiguredExample from './DemoConfiguredExample'
import { projectStyleExample, type ProjectStyleName } from './project-style-examples'

export default function ProjectStyleExample({ name, code = true }: { name: ProjectStyleName, code?: boolean }) {
  return <DemoConfiguredExample name={name} {...projectStyleExample(name)} code={code} />
}
