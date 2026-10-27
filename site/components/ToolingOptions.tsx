import DocumentOptions from './DocumentOptions'
import { toolingOptionGroup, toolingOptions } from '../utils/tooling-guide-data'

export default function ToolingOptions({ name }: { name: keyof typeof toolingOptions }) {
  return <div data-tooling-options={name}><DocumentOptions {...toolingOptionGroup(name)} /></div>
}
