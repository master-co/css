import Slugger from 'github-slugger'
import { visit } from 'unist-util-visit'
import resolveHeading from '../utils/resolve-heading.js'
import { parse } from 'acorn'

export default function remarkSlugAndTOC() {
  return (tree) => {
    const slugs = new Slugger()
    const toc = []

    visit(tree, 'heading', (node) => {
      const depth = node.depth
      if (depth !== 2 && depth !== 3) return

      // Extract raw text from heading children
      const title = node.children
        .filter((n) => n.type === 'text' || n.type === 'inlineCode')
        .map((n) => n.value)
        .join(' ')
        .trim()

      const id = slugs.slug(title)
      const resolved = resolveHeading(title, id)
      // Explicit IDs survive title edits and translations; they are not visible prose.
      const lastText = node.children.findLast((child) => child.type === 'text')
      if (lastText) lastText.value = lastText.value.replace(/\s+\{#[\w-]+\}$/, '')
      node.data ??= {}
      node.data.hProperties ??= {}
      node.data.id = resolved.id
      node.data.hProperties.id = resolved.id

      toc.push({
        id: resolved.id,
        title: resolved.title,
        level: depth
      })
    })

    const tocCode = `export const toc = ${JSON.stringify(toc, null, 2)};`

    // Inject toc as ESM export
    tree.children.unshift({
      type: 'mdxjsEsm',
      value: tocCode,
      data: {
        estree: parse(tocCode, {
          ecmaVersion: 'latest',
          sourceType: 'module',
        }),
      }
    })
  }
}
