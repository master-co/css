import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { installationGuidesMarkdown } from './installation-guides'
import { installationIllustrationMarkdown } from '../content/guide/installation/(main)/illustration'

export const installationGuideSlugs = [
  '',
  'vite', 'webpack', 'server-rendered',
  'nextjs', 'nuxtjs', 'astro', 'svelte', 'angular', 'lit', 'storybook'
] as const

export async function installationGuideContent(siteRoot: string, slug: string) {
  if (!installationGuideSlugs.includes(slug as typeof installationGuideSlugs[number])) throw new Error(`Unsupported installation guide: ${slug}`)
  const route = slug || '(main)'
  const result = await extractReferenceMdx(path.join(siteRoot, `content/guide/installation/${route}/content.mdx`), [], [], {
    overview: 'include',
    component(name) {
      // Decorative branding has no tutorial content in search or Markdown exports.
      if (name === 'IntegrationCover') return ''
      if (name === 'InstallationIllustration') return installationIllustrationMarkdown()
      if (name === 'InstallationGuides') return installationGuidesMarkdown()
    }
  })
  if (result.notes.length) throw new Error(`Incomplete installation/${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
