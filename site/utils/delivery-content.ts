import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { deliveryFlowMarkdown } from './delivery-flows'
import { firstPaintMarkdown, resourceWaterfallsMarkdown } from './first-paint-examples'

export const deliveryGuideSlugs = ['rendering-modes', 'scanning-latent-classes', 'native-css-pruning', 'route-level-styles', 'preload-critical-resources', 'flash-of-unstyled-content'] as const

export async function deliveryGuideContent(siteRoot: string, slug: string) {
  if (!deliveryGuideSlugs.includes(slug as typeof deliveryGuideSlugs[number])) throw new Error(`Unsupported delivery guide: ${slug}`)
  const result = await extractReferenceMdx(path.join(siteRoot, `app/[locale]/guide/${slug}/content.mdx`), [], [], {
    overview: 'include',
    component: (name, attributes) => name === 'DeliveryFlow' ? deliveryFlowMarkdown(String(attributes.name))
      : name === 'ResourceWaterfall' ? resourceWaterfallsMarkdown()
        : name === 'FirstPaintComparison' ? firstPaintMarkdown()
          : name === 'ModeImg' ? `![${String(attributes.alt)}](${String(attributes.src)})`
            : name === 'FOUCSvg' ? '![An unstyled page beside the same styled page](/fouc.svg)'
              : name === 'Comparisons' ? '[Rendering mode comparison table](/guide/rendering-modes#comparisons)' : undefined
  })
  if (result.notes.length) throw new Error(`Incomplete ${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
