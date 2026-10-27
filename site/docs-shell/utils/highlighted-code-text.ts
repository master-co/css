import type { Element, Root, RootContent } from 'hast'

function hasLineClass(element: Element): boolean {
  const classes = element.properties?.class
  if (Array.isArray(classes)) return classes.includes('line')
  return typeof classes === 'string' && classes.split(/\s+/).includes('line')
}

function textContent(node: RootContent): string {
  if (node.type === 'text') return node.value
  if (node.type !== 'element') return ''
  return node.children.map(textContent).join('')
}

/** Copy Shiki's rendered lines, without trailing whitespace left by notation markers. */
export default function highlightedCodeText(root: Root): string {
  const lines: string[] = []
  const visit = (nodes: RootContent[]) => {
    for (const node of nodes) {
      if (node.type !== 'element') continue
      if (hasLineClass(node)) lines.push(node.children.map(textContent).join('').replace(/[\t ]+$/u, ''))
      else visit(node.children)
    }
  }
  visit(root.children)
  return lines.join('\n')
}
