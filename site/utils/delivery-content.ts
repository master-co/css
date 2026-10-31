import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { deliveryFlowMarkdown } from './delivery-flows'
import { firstPaintMarkdown, resourceWaterfallsMarkdown } from './first-paint-examples'

export const deliveryGuideSlugs = ['rendering-modes', 'scanning-latent-classes', 'native-css-pruning', 'route-level-styles', 'preload-critical-resources', 'flash-of-unstyled-content'] as const

export const deliveryBlogSlugs = ['master-css-next', 'bootstrapping-master-css-with-vite'] as const

export async function deliveryBlogContent(siteRoot: string, slug: string) {
  if (!deliveryBlogSlugs.includes(slug as typeof deliveryBlogSlugs[number])) throw new Error(`Unsupported delivery blog: ${slug}`)
  return deliveryContent(siteRoot, 'blog', slug)
}

export async function deliveryGuideContent(siteRoot: string, slug: string) {
  if (!deliveryGuideSlugs.includes(slug as typeof deliveryGuideSlugs[number])) throw new Error(`Unsupported delivery guide: ${slug}`)
  return deliveryContent(siteRoot, 'guide', slug)
}

async function deliveryContent(siteRoot: string, section: string, slug: string) {
  const result = await extractReferenceMdx(path.join(siteRoot, `content/${section}/${slug}/content.mdx`), [], [], {
    overview: 'include',
    component: (name, attributes) => name === 'ArticleTOC' ? '' : name === 'DeliveryFlow' ? deliveryFlowMarkdown(String(attributes.name))
      : name === 'ResourceWaterfall' ? resourceWaterfallsMarkdown()
        : name === 'FirstPaintComparison' ? firstPaintMarkdown()
          : name === 'ModeImg' ? `![${String(attributes.alt)}](${String(attributes.src)})` : undefined
  })
  if (result.notes.length) throw new Error(`Incomplete ${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
