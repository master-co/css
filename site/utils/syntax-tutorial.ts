import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'

export async function syntaxTutorialContent(siteRoot: string) {
  const result = await extractReferenceMdx(path.join(siteRoot, 'app/[locale]/guide/syntax-tutorial/content.mdx'))
  if (result.notes.length) throw new Error(`Incomplete Syntax Tutorial export: ${result.notes.join('; ')}`)
  // Search needs the authored heading IDs before portable Markdown separates
  // them into anchor elements. Both paths retain the same prose and code.
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
