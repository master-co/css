import type { Root } from 'hast'
import highlightedCodeText from './highlighted-code-text'

export interface PreparedCode {
  /** The complete highlighted `<pre>`. */
  html: string
  text: string
}

/** Store trusted Shiki HTML so a page renders the block without highlighting it again. */
export async function prepareCode(tree: Root): Promise<PreparedCode> {
  const pre = tree.children[0]
  if (pre?.type !== 'element' || pre.tagName !== 'pre' || tree.children.length !== 1) {
    throw new Error('Expected one highlighted code block')
  }
  const { hastToHtml } = await import('shiki/core')
  return {
    html: hastToHtml(tree),
    text: highlightedCodeText(tree)
  }
}
