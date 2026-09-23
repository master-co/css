import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { toolingExampleMarkdown, toolingOptionsMarkdown } from './tooling-guide-data'

export const toolingGuideSlugs = ['code-linting', 'language-service'] as const

export async function toolingGuideContent(siteRoot: string, slug: string) {
  if (!toolingGuideSlugs.includes(slug as typeof toolingGuideSlugs[number])) throw new Error(`Unsupported tooling guide: ${slug}`)
  const result = await extractReferenceMdx(path.join(siteRoot, `app/[locale]/guide/${slug}/content.mdx`), [], [], {
    overview: 'include',
    component: (name, attributes) => name === 'ToolingOptions' ? toolingOptionsMarkdown(String(attributes.name))
      : name === 'ToolingExample' ? toolingExampleMarkdown(String(attributes.name)) : undefined
  })
  if (result.notes.length) throw new Error(`Incomplete ${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
