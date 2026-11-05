import { readLocalizedDocument } from '@master/internal-site/build/localization.ts'
import { demoCopy } from '@master/internal-site/utils/document-copy.js'
import { translateSite } from './translations'
import { deliveryIllustrationMarkdown } from '../content/guide/optimizing-css-delivery/illustrations'
import { localizedContentFile } from './localized-content'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { deliveryFlow, deliveryFlowMarkdown } from './delivery-flows'
import { firstPaintMarkdown, resourceWaterfalls, resourceWaterfallsMarkdown } from './first-paint-examples'

export const deliveryGuideSlugs = ['rendering-modes', 'scanning-and-pruning', 'route-level-styles', 'optimizing-css-delivery'] as const

export async function deliveryGuideContent(siteRoot: string, slug: string, locale = 'en') {
  if (!deliveryGuideSlugs.includes(slug as typeof deliveryGuideSlugs[number])) throw new Error(`Unsupported delivery guide: ${slug}`)
  return deliveryContent(siteRoot, 'guide', slug, locale)
}

async function deliveryContent(siteRoot: string, section: string, slug: string, locale: string) {
  const file = await localizedContentFile(siteRoot, `content/${section}/${slug}/content.mdx`, locale)
  const { frontmatter } = await readLocalizedDocument({ sourceFile: file, locale })
  const t = (text: string) => translateSite(locale, text)
  const result = await extractReferenceMdx(file, [], [], {
    overview: 'include',
    component: (name, attributes) => name === 'DeliveryIllustration' ? deliveryIllustrationMarkdown(String(attributes.id)) : name === 'ArticleTOC' ? '' : name === 'DeliveryFlow' ? deliveryFlowMarkdown(String(attributes.name), demoCopy(frontmatter, locale, `DeliveryFlow:${attributes.name}`, deliveryFlow(String(attributes.name))))
      : name === 'ResourceWaterfall' ? resourceWaterfallsMarkdown(demoCopy(frontmatter, locale, 'ResourceWaterfall', resourceWaterfalls), { resources: t('Resources shown'), marker: t('Marker') })
        : name === 'FirstPaintComparison' ? firstPaintMarkdown(t)
          : name === 'ModeImg' ? `![${String(attributes.alt)}](${String(attributes.src)})` : undefined
  })
  if (result.notes.length) throw new Error(`Incomplete ${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
