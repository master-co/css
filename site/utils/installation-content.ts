import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { installationGuidesMarkdown } from './installation-guides'
import { deliveryFlowMarkdown } from './delivery-flows'

export const installationGuideSlugs = [
  '', 'integrations', 'cli', 'cdn',
  'vite', 'webpack', 'server-rendered',
  'nextjs', 'nuxtjs', 'astro', 'svelte', 'angular', 'lit', 'storybook'
] as const

export async function installationGuideContent(siteRoot: string, slug: string) {
  if (!installationGuideSlugs.includes(slug as typeof installationGuideSlugs[number])) throw new Error(`Unsupported installation guide: ${slug}`)
  const route = ['', 'integrations', 'cli', 'cdn'].includes(slug) ? `(main)/${slug}` : slug
  const result = await extractReferenceMdx(path.join(siteRoot, `content/guide/installation/${route}/content.mdx`), [], [], {
    overview: 'include',
    component(name, attributes) {
      if (name === 'InstallationGuides') return installationGuidesMarkdown()
      if (name === 'DeliveryFlow') return deliveryFlowMarkdown(String(attributes.name))
    }
  })
  if (result.notes.length) throw new Error(`Incomplete installation/${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
