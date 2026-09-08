import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'

export async function syntaxTutorialContent(siteRoot: string) {
  const result = await extractReferenceMdx(path.join(siteRoot, 'app/[locale]/guide/syntax-tutorial/content.mdx'))
  if (result.notes.length) throw new Error(`Incomplete Syntax Tutorial export: ${result.notes.join('; ')}`)
  return { ...result, markdown: portableMarkdown(result.markdown) }
}
