import { aiIllustrationMarkdown } from '../content/guide/ai-coding/illustration'
import { localizedContentFile } from './localized-content'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { configuredMarkupMarkdown } from '@master/internal-site/css/configured-example.ts'
import { agentPrompt, agentPromptMarkdown, resolveAgentPrompt, agentFixExample, previewWorkflow, previewWorkflowMarkdown } from './agent-guide-data'
import { agentOptionGroup, agentOptionsMarkdown } from './agent-options'
import { agentStyleExample } from './agent-style-example'
import { readLocalizedDocument } from '@master/internal-site/build/localization.ts'
import { demoCopy } from '@master/internal-site/utils/document-copy.js'
import { readPublicEnv } from './public-env.js'

export const agentGuideSlugs = ['ai-coding'] as const

export function agentFixMarkdown(example = agentFixExample) {
  return `${example.title}\n\n${example.sourceLabel}:\n\n\`\`\`html\n${example.source}\n\`\`\`\n\n${example.resultLabel}:\n\n\`\`\`html\n${example.result}\n\`\`\``
}

export async function agentGuideContent(siteRoot: string, slug: string, locale = 'en') {
  if (!agentGuideSlugs.includes(slug as typeof agentGuideSlugs[number])) throw new Error(`Unsupported agent guide: ${slug}`)
  const file = await localizedContentFile(siteRoot, `content/guide/${slug}/content.mdx`, locale)
  const { frontmatter } = await readLocalizedDocument({ sourceFile: file, locale })
  const { PUBLIC_VERSION: version, PUBLIC_URL: docsURL } = readPublicEnv()
  const result = await extractReferenceMdx(file, [], [], {
    overview: 'include',
    component(name, attributes) {
      if (name === 'AIIllustration') return aiIllustrationMarkdown()
      if (name === 'AgentPrompt') return agentPromptMarkdown(String(attributes.name), resolveAgentPrompt(demoCopy(frontmatter, locale, `AgentPrompt:${attributes.name}`, agentPrompt(String(attributes.name))), { version, docsURL }))
      if (name === 'AgentOptions') return agentOptionsMarkdown(String(attributes.name), demoCopy(frontmatter, locale, `AgentOptions:${attributes.name}`, agentOptionGroup(String(attributes.name))))
      if (name === 'AgentWorkflow') return previewWorkflowMarkdown(demoCopy(frontmatter, locale, 'AgentWorkflow', previewWorkflow))
      if (name === 'AgentFixExample') return agentFixMarkdown(demoCopy(frontmatter, locale, 'AgentFixExample', agentFixExample))
      if (name === 'AgentStyleExample') {
        const example = demoCopy(frontmatter, locale, 'AgentStyleExample', agentStyleExample)
        return `${configuredMarkupMarkdown(example.source, example.html)}\n\n${example.caption}`
      }
    }
  })
  if (result.notes.length) throw new Error(`Incomplete ${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
