import { guideStudyMarkdown } from '../content/guide/studies'
import { tokenValuesMarkdown } from './token-values'
import { fixedUtilitiesMarkdown } from './fixed-utilities'
import { referenceIllustrationMarkdown } from './illustrations'
import { fileTreeText } from '../utils/package-trees'
import { readLocalizedDocument } from '@master/internal-site/build/localization.ts'
import { figureMarkdown, type FigureCopy } from '../utils/figure-copy'
import type { DocumentFileEntry } from '@master/internal-site/components/document-types.ts'
import { extractReferenceMdx as extract, type MdxContentOptions, type SyntaxRow } from '@master/internal-site/css/markdown.ts'

export { portableMarkdown, syntaxMarkdown, type MdxContentOptions } from '@master/internal-site/css/markdown.ts'

/** Product-only facts adapt the shared MDX exporter without copying its renderer. */
export async function extractReferenceMdx(file: string, rows: SyntaxRow[] = [], stack: string[] = [], options: MdxContentOptions & { locale?: string } = {}) {
  const locale = options.locale ?? file.match(/\.(tw|ja|ko|cn)\.mdx$/)?.[1] ?? 'en'
  const frontmatter = locale === 'en' ? {} : (await readLocalizedDocument({ sourceFile: file, locale })).frontmatter
  return extract(file, rows, stack, {
    ...options,
    async component(name, attributes, source, context) {
      if (locale !== 'en' && name !== 'ReferenceIllustration' && (name === 'GuideStudy' || name.endsWith('Illustration'))) {
        const suffix = attributes.id ?? attributes.name
        const key = suffix ? `${name}:${suffix}` : name
        const figure = frontmatter.figures?.[key] as FigureCopy | undefined
        if (!figure || ['title', 'alt', 'caption'].some(field => typeof figure[field as keyof FigureCopy] !== 'string' || !String(figure[field as keyof FigureCopy]).trim())) throw new Error(`Missing localized figure copy: ${key} (${locale})`)
        if (figure.description?.some(item => !item.title?.trim() || !item.text?.trim())) throw new Error(`Incomplete localized figure explanation: ${key} (${locale})`)
        return figureMarkdown(figure)
      }
      if (name === 'GuideStudy') return guideStudyMarkdown(String(attributes.id))
      if (name === 'ExplorerView') {
        const items = await context.expression(attributes.items.value) as DocumentFileEntry[]
        return `\`\`\`text\n${fileTreeText(items)}\n\`\`\``
      }
      const adapted = await options.component?.(name, attributes, source, context)
      if (adapted !== undefined) return adapted
      if (name === 'ReferenceIllustration') return referenceIllustrationMarkdown(attributes.id, locale)
      if (name === 'TokenValues') return tokenValuesMarkdown(attributes.namespace, await context.expression(attributes.keys.value) as string[])
      if (name === 'FixedUtilities') return fixedUtilitiesMarkdown(locale)
    }
  })
}
