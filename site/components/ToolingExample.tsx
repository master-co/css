import DocumentCodeExample from './DocumentCodeExample'
import { toolingExample, toolingExamples } from '../utils/tooling-guide-data'

export default function ToolingExample({ name }: { name: keyof typeof toolingExamples }) {
  return <div data-tooling-example={name}><DocumentCodeExample {...toolingExample(name)} /></div>
}
