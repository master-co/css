import type { DocumentValueRow } from '../components/DocumentValues'

/** Group only the normalized token facts; unknown prose keeps the general renderer. */
export function tokenValueEntry(nodes: any[], start: number) {
  if (nodes[start]?.type !== 'heading' || nodes[start].depth !== 3) return
  let end = start + 1
  let identifier: string | undefined
  const paragraph = nodes[end]
  if (paragraph?.type === 'paragraph' && paragraph.children.length === 3
    && paragraph.children[0].value === 'CSS variable: ' && paragraph.children[1].type === 'inlineCode'
    && paragraph.children[2].value === '.') {
    identifier = paragraph.children[1].value
    end++
  }
  const values: DocumentValueRow['values'] = []
  while (nodes[end]?.type === 'code' && nodes[end].lang === 'text') {
    const match = nodes[end].value.match(/^([^:\n]+): ([\s\S]*)$/)
    if (!match) return
    values.push({ label: match[1], value: match[2] })
    end++
  }
  if (!values.length) return
  return { end, row: { identifier, values } }
}
