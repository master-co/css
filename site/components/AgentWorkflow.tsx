import DocumentFlow from './DocumentFlow'
import { previewWorkflow } from '../utils/agent-guide-data'

export default function AgentWorkflow() {
  return <div data-agent-workflow><DocumentFlow {...previewWorkflow} /></div>
}
