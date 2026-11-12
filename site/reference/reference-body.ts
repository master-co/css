import { referenceLabel } from './ui'
import type { ReferenceRenderDocument } from './render-document'

/**
 * What `ReferenceBody.astro` needs to know beyond one node while it renders the normalized
 * reference Markdown: link definitions, the heading each `##`/`###` takes from the document's
 * heading list, and the entrypoint (the latest `##`) a table of exports belongs to. Astro renders
 * nodes as separate components, so these are resolved in document order before rendering.
 */
export interface ReferenceBodyContext {
  definitions: Map<string, any>
  headingOf: Map<any, ReferenceRenderDocument['headings'][number]>
  entrypointOf: Map<any, string>
  plainInlineCode: WeakSet<object>
}

const headingAnchor = /\s+\{#[\w-]+\}$/

export function createReferenceBodyContext({ tree, headings }: Pick<ReferenceRenderDocument, 'tree' | 'headings'>): ReferenceBodyContext {
  const definitions = new Map<string, any>()
  for (const node of tree.children) if (node.type === 'definition') definitions.set(node.identifier, node)
  const headingOf = new Map<any, ReferenceRenderDocument['headings'][number]>()
  const entrypointOf = new Map<any, string>()
  const plainInlineCode = new WeakSet<object>()
  let headingIndex = 0
  let entrypoint = ''
  function visit(node: any, plainCode = false) {
    // Headings and ordinary data tables use plain identifiers; prose and parameter descriptions use code chips.
    plainCode ||= node.type === 'heading' || node.type === 'table' && referenceTable(node).kind === 'table'
    if (node.type === 'inlineCode' && plainCode) plainInlineCode.add(node)
    if (node.type === 'heading') {
      if (node.depth === 2) entrypoint = node.children.map((child: any) => child.value ?? '').join('').replace(headingAnchor, '')
      if (node.depth === 2 || node.depth === 3) headingOf.set(node, headings[headingIndex++])
    }
    if (node.type === 'table') entrypointOf.set(node, entrypoint)
    node.children?.forEach((child: any) => visit(child, plainCode))
  }
  tree.children.forEach(node => visit(node))
  return { definitions, headingOf, entrypointOf, plainInlineCode }
}

/** Heading text without its trailing `{#id}`. */
export function headingChildren(node: any) {
  return node.children.map((child: any) => child.type === 'text' ? { ...child, value: child.value.replace(headingAnchor, '') } : child)
}

/** An empty paragraph or HTML node that only places `<a id>` keeps the anchor. */
export function anchorOf(node: any): string | undefined {
  if (node.type === 'html') return node.value.match(/^<a id="([\w-]+)"><\/a>$/)?.[1]
  if (node.type === 'paragraph') return node.children.every((child: any) => child.type === 'html')
    && node.children.map((child: any) => child.value).join('').match(/^<a id="([\w-]+)"><\/a>$/)?.[1] || undefined
}

export type ReferenceTable =
  | { kind: 'api', compact: boolean, entries: { name: string, href: string, description: string }[] }
  | { kind: 'options', options: { name: string, defaultValue: string, description: any[] }[] }
  | { kind: 'parameters', parameters: { name: string, type: string, requirement: string, description: any[] }[] }
  | { kind: 'code', label: string, rows: { syntax: string, css: string }[] }
  | { kind: 'namespace', rows: { namespace: string, consumers: string[] }[] }
  | { kind: 'table', label: string, comparison: boolean }

/** Structured cell shapes select the reading component independently of translated headings. */
export function referenceTable(node: any): ReferenceTable {
  const cells = node.children[0].children
  const rows = node.children.slice(1)
  const one = (cell: any, type: string) => cell.children.length === 1 && cell.children[0].type === type
  const columnCount = (count: number) => cells.length === count && rows.length > 0 && rows.every((row: any) => row.children.length === count)
  const apiIndex = columnCount(2) && rows.every((row: any) => one(row.children[0], 'link')
    && one(row.children[0].children[0], 'inlineCode') && one(row.children[1], 'text'))
  if (apiIndex) return {
    kind: 'api', compact: rows.every((row: any) => /#api-[\da-f]+$/.test(row.children[0].children[0].url)),
    entries: rows.map((row: any) => ({ name: row.children[0].children[0].children[0].value, href: row.children[0].children[0].url, description: row.children[1].children[0].value })),
  }
  if (columnCount(3) && rows.every((row: any) => row.children.slice(0, 2).every((cell: any) => one(cell, 'inlineCode')))
    && rows.some((row: any) => row.children[2].children.some((child: any) => child.type !== 'inlineCode'))) {
    return { kind: 'options', options: rows.map((row: any) => ({ name: row.children[0].children[0].value, defaultValue: row.children[1].children[0].value, description: row.children[2].children })) }
  }
  if (columnCount(4) && rows.every((row: any) => row.children.slice(0, 2).every((cell: any) => one(cell, 'inlineCode')) && one(row.children[2], 'text'))) {
    return { kind: 'parameters', parameters: rows.map((row: any) => ({ name: row.children[0].children[0].value, type: row.children[1].children[0].value, requirement: row.children[2].children[0].value, description: row.children[3].children })) }
  }
  if (columnCount(2) && rows.every((row: any) => one(row.children[0], 'inlineCode') && row.children[0].children[0].value.endsWith('-*')
    && row.children[1].children.every((child: any) => child.type === 'inlineCode' || child.type === 'text' && /^[,\s]*$/.test(child.value)))) {
    return { kind: 'namespace', rows: rows.map((row: any) => ({ namespace: row.children[0].children[0].value.slice(0, -2), consumers: row.children[1].children.filter((child: any) => child.type === 'inlineCode').map((child: any) => child.value) })) }
  }
  const label = cells.map((cell: any) => cell.children.map((child: any) => child.value ?? '').join('')).join(', ')
  if (columnCount(2) && rows.every((row: any) => row.children.every((cell: any) => one(cell, 'inlineCode')))) {
    return { kind: 'code', label, rows: rows.map((row: any) => ({ syntax: row.children[0].children[0].value, css: row.children[1].children[0].value })) }
  }
  return { kind: 'table', label, comparison: cells.length === 2 }
}

/** Fenced code: a long declaration, a Generated CSS output, or a complete schema/help disclosure. */
export function referenceCodeWrapper(node: any, locale = 'en') {
  if (node.lang === 'typescript' && node.meta === 'declaration') return { kind: 'declaration' as const }
  const disclosure = node.meta?.match(/\bdisclosure=(input-schema|output-schema|command-help)\b/)?.[1] as 'input-schema' | 'output-schema' | 'command-help' | undefined
  const titles = { 'input-schema': referenceLabel(locale, 'inputSchema'), 'output-schema': referenceLabel(locale, 'outputSchema'), 'command-help': referenceLabel(locale, 'commandHelp') }
  if (/\bdisclosure=generated-css\b/.test(node.meta ?? '')) return { kind: 'generated-css' as const }
  return disclosure ? { kind: 'disclosure' as const, title: titles[disclosure] } : undefined
}
