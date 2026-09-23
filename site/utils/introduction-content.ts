import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'

export async function introductionContent(siteRoot: string) {
  const result = await extractReferenceMdx(path.join(siteRoot, 'app/[locale]/guide/introduction/content.mdx'), [], [], { overview: 'include' })
  if (result.notes.length) throw new Error(`Incomplete Introduction export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
