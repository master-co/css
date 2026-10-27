import DocumentOptions from './DocumentOptions'
import { agentOptionGroup } from '../utils/agent-options'

export default function AgentOptions({ name }: { name: string }) {
  return <div data-agent-options={name}><DocumentOptions {...agentOptionGroup(name)} /></div>
}
