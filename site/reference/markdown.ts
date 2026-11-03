import { guideStudyMarkdown } from '../content/guide/studies'
import { tokenValuesMarkdown } from './token-values'
import { referenceIllustrationMarkdown } from './illustrations'
import { fileTreeText } from '../utils/package-trees'
import type { DocumentFileEntry } from '@master/internal-site/components/document-types.ts'
import { extractReferenceMdx as extract, type MdxContentOptions, type SyntaxRow } from '@master/internal-site/css/markdown.ts'

export { portableMarkdown, syntaxMarkdown, type MdxContentOptions } from '@master/internal-site/css/markdown.ts'

/** Product-only facts adapt the shared MDX exporter without copying its renderer. */
export function extractReferenceMdx(file: string, rows: SyntaxRow[] = [], stack: string[] = [], options: MdxContentOptions = {}) {
  return extract(file, rows, stack, {
    ...options,
    async component(name, attributes, source, context) {
      if (name === 'GuideStudy') return guideStudyMarkdown(String(attributes.id))
      if (name === 'ExplorerView') {
        const items = await context.expression(attributes.items.value) as DocumentFileEntry[]
        return `\`\`\`text\n${fileTreeText(items)}\n\`\`\``
      }
      const adapted = await options.component?.(name, attributes, source, context)
      if (adapted !== undefined) return adapted
      if (name === 'ReferenceIllustration') return referenceIllustrationMarkdown(attributes.id)
      if (name === 'TokenValues') return tokenValuesMarkdown(attributes.namespace, await context.expression(attributes.keys.value) as string[])
    }
  })
}
