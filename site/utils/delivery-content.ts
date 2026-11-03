import { deliveryIllustrationMarkdown } from '../content/guide/optimizing-css-delivery/illustrations'
import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { deliveryFlowMarkdown } from './delivery-flows'
import { firstPaintMarkdown, resourceWaterfallsMarkdown } from './first-paint-examples'

export const deliveryGuideSlugs = ['rendering-modes', 'scanning-and-pruning', 'route-level-styles', 'optimizing-css-delivery'] as const

export async function deliveryGuideContent(siteRoot: string, slug: string) {
  if (!deliveryGuideSlugs.includes(slug as typeof deliveryGuideSlugs[number])) throw new Error(`Unsupported delivery guide: ${slug}`)
  return deliveryContent(siteRoot, 'guide', slug)
}

async function deliveryContent(siteRoot: string, section: string, slug: string) {
  const result = await extractReferenceMdx(path.join(siteRoot, `content/${section}/${slug}/content.mdx`), [], [], {
    overview: 'include',
    component: (name, attributes) => name === 'DeliveryIllustration' ? deliveryIllustrationMarkdown(String(attributes.id)) : name === 'ArticleTOC' ? '' : name === 'DeliveryFlow' ? deliveryFlowMarkdown(String(attributes.name))
      : name === 'ResourceWaterfall' ? resourceWaterfallsMarkdown()
        : name === 'FirstPaintComparison' ? firstPaintMarkdown()
          : name === 'ModeImg' ? `![${String(attributes.alt)}](${String(attributes.src)})` : undefined
  })
  if (result.notes.length) throw new Error(`Incomplete ${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
