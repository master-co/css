import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { configuredMarkupMarkdown } from '../reference/configured-example'
import { agentPromptMarkdown, agentFixExample, previewWorkflowMarkdown } from './agent-guide-data'
import { agentOptionsMarkdown } from './agent-options'
import { agentStyleExample } from './agent-style-example'

export const agentGuideSlugs = ['ai-coding', 'mcp-server'] as const

export function agentFixMarkdown() {
  return `${agentFixExample.title}\n\n${agentFixExample.sourceLabel}:\n\n\`\`\`html\n${agentFixExample.source}\n\`\`\`\n\n${agentFixExample.resultLabel}:\n\n\`\`\`html\n${agentFixExample.result}\n\`\`\``
}

export async function agentGuideContent(siteRoot: string, slug: string) {
  if (!agentGuideSlugs.includes(slug as typeof agentGuideSlugs[number])) throw new Error(`Unsupported agent guide: ${slug}`)
  const result = await extractReferenceMdx(path.join(siteRoot, `app/[locale]/guide/${slug}/content.mdx`), [], [], {
    overview: 'include',
    component(name, attributes) {
      if (name === 'AgentPrompt') return agentPromptMarkdown(String(attributes.name))
      if (name === 'AgentOptions') return agentOptionsMarkdown(String(attributes.name))
      if (name === 'AgentWorkflow') return previewWorkflowMarkdown()
      if (name === 'AgentFixExample') return agentFixMarkdown()
      if (name === 'AgentStyleExample') return `${configuredMarkupMarkdown(agentStyleExample.source, agentStyleExample.html)}\n\n${agentStyleExample.caption}`
    }
  })
  if (result.notes.length) throw new Error(`Incomplete ${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
