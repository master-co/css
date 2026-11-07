import { localizedContentFile } from './localized-content'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { installationGuidesMarkdown } from './installation-guides'
import { installationIllustrationMarkdown } from '../content/guide/installation/(main)/illustration'
import { translateSite } from './translations'
import { agentPromptExport } from './agent-content'
import { readLocalizedDocument } from '@master/internal-site/build/localization.ts'

export const installationGuideSlugs = [
  '',
  'vite', 'webpack', 'server-rendered',
  'nextjs', 'nuxtjs', 'astro', 'svelte', 'angular', 'lit', 'storybook'
] as const

export async function installationGuideContent(siteRoot: string, slug: string, locale = 'en') {
  if (!installationGuideSlugs.includes(slug as typeof installationGuideSlugs[number])) throw new Error(`Unsupported installation guide: ${slug}`)
  const route = slug || '(main)'
  const file = await localizedContentFile(siteRoot, `content/guide/installation/${route}/content.mdx`, locale)
  const { frontmatter } = await readLocalizedDocument({ sourceFile: file, locale })
  const result = await extractReferenceMdx(file, [], [], {
    overview: 'include',
    component(name, attributes) {
      // Decorative branding has no tutorial content in search or Markdown exports.
      if (name === 'IntegrationCover') return ''
      if (name === 'InstallationIllustration') return installationIllustrationMarkdown()
      if (name === 'InstallationGuides') return installationGuidesMarkdown(text => translateSite(locale, text))
      if (name === 'AgentPrompt') return agentPromptExport(String(attributes.name), frontmatter, locale)
    }
  })
  if (result.notes.length) throw new Error(`Incomplete installation/${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
