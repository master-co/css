import DemoConfiguredExample from './demo/DemoConfiguredExample'
import { agentStyleExample } from '../utils/agent-style-example'

export default function AgentStyleExample({ code = true }: { code?: boolean }) {
  return <DemoConfiguredExample name="agent-project-vocabulary" {...agentStyleExample} code={code} />
}
