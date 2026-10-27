import DocumentPrompt from './DocumentPrompt'
import { agentPrompt } from '../utils/agent-guide-data'

export default function AgentPrompt({ name }: { name: string }) {
  return <div data-agent-prompt={name}><DocumentPrompt {...agentPrompt(name)} /></div>
}
