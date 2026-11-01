import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { syntaxIllustrationMarkdown } from '../content/guide/syntax-tutorial/illustration'

export async function syntaxTutorialContent(siteRoot: string) {
  const result = await extractReferenceMdx(path.join(siteRoot, 'content/guide/syntax-tutorial/content.mdx'), [], [], {
    component: name => name === 'SyntaxIllustration' ? syntaxIllustrationMarkdown() : undefined
  })
  if (result.notes.length) throw new Error(`Incomplete Syntax Tutorial export: ${result.notes.join('; ')}`)
  // Search needs the authored heading IDs before portable Markdown separates
  // them into anchor elements. Both paths retain the same prose and code.
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
