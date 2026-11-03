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
}

const headingAnchor = /\s+\{#[\w-]+\}$/

export function createReferenceBodyContext({ tree, headings }: Pick<ReferenceRenderDocument, 'tree' | 'headings'>): ReferenceBodyContext {
  const definitions = new Map<string, any>()
  for (const node of tree.children) if (node.type === 'definition') definitions.set(node.identifier, node)
  const headingOf = new Map<any, ReferenceRenderDocument['headings'][number]>()
  const entrypointOf = new Map<any, string>()
  let headingIndex = 0
  let entrypoint = ''
  function visit(node: any) {
    if (node.type === 'heading') {
      if (node.depth === 2) entrypoint = node.children.map((child: any) => child.value ?? '').join('').replace(headingAnchor, '')
      if (node.depth === 2 || node.depth === 3) headingOf.set(node, headings[headingIndex++])
    }
    if (node.type === 'table') entrypointOf.set(node, entrypoint)
    node.children?.forEach(visit)
  }
  tree.children.forEach(visit)
  return { definitions, headingOf, entrypointOf }
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

/** Tables with a known header become the document components; descriptions stay Markdown nodes. */
export function referenceTable(node: any): ReferenceTable {
  const cells = node.children[0].children
  const rows = node.children.slice(1)
  const apiIndex = cells.length === 2 && cells.every((cell: any) => cell.children.length === 1 && cell.children[0].type === 'text')
    && (cells[0].children[0].value === 'Import path' && cells[1].children[0].value === 'Purpose'
      || cells[0].children[0].value === 'Export' && cells[1].children[0].value === 'Kind')
    && rows.every((row: any) => row.children.length === 2 && row.children[0].children.length === 1
      && row.children[0].children[0].type === 'link' && row.children[0].children[0].children.length === 1
      && row.children[0].children[0].children[0].type === 'inlineCode'
      && row.children[1].children.length === 1 && row.children[1].children[0].type === 'text')
  if (apiIndex) return {
    kind: 'api',
    compact: cells[0].children[0].value === 'Export',
    entries: rows.map((row: any) => ({ name: row.children[0].children[0].children[0].value, href: row.children[0].children[0].url, description: row.children[1].children[0].value }))
  }
  if (cells.length === 3 && cells.every((cell: any, index: number) => cell.children.length === 1 && cell.children[0].value === ['Setting', 'Default', 'Effect'][index])
    && rows.every((row: any) => row.children.length === 3 && row.children.slice(0, 2).every((cell: any) => cell.children.length === 1 && cell.children[0].type === 'inlineCode'))) {
    return {
      kind: 'options',
      options: rows.map((row: any) => ({
        name: row.children[0].children[0].value, defaultValue: row.children[1].children[0].value,
        description: row.children[2].children
      }))
    }
  }
  if (cells.length === 4 && cells.every((cell: any, index: number) => cell.children.length === 1 && cell.children[0].value === ['Parameter', 'Type', 'Requirement', 'Description'][index])
    && rows.every((row: any) => row.children.length === 4 && row.children.slice(0, 2).every((cell: any) => cell.children.length === 1 && cell.children[0].type === 'inlineCode') && row.children[2].children.length === 1 && row.children[2].children[0].type === 'text')) {
    return {
      kind: 'parameters',
      parameters: rows.map((row: any) => ({
        name: row.children[0].children[0].value, type: row.children[1].children[0].value,
        requirement: row.children[2].children[0].value, description: row.children[3].children
      }))
    }
  }
  if (cells.length === 2 && ['Token', 'Syntax'].includes(cells[0].children[0]?.value) && cells[1].children[0]?.value === 'CSS'
    && rows.every((row: any) => row.children.length === 2 && row.children.every((cell: any) => cell.children.length === 1 && cell.children[0].type === 'inlineCode'))) {
    return { kind: 'code', label: cells[0].children[0].value, rows: rows.map((row: any) => ({ syntax: row.children[0].children[0].value, css: row.children[1].children[0].value })) }
  }
  if (cells.length === 2 && cells[0].children[0]?.value === 'Namespace' && cells[1].children[0]?.value === 'Consumers'
    && rows.every((row: any) => row.children.length === 2 && row.children[0].children.length === 1 && row.children[0].children[0].type === 'inlineCode' && row.children[0].children[0].value.endsWith('-*')
      && row.children[1].children.every((child: any) => child.type === 'inlineCode' || child.type === 'text' && /^[,\s]*$/.test(child.value)))) {
    return {
      kind: 'namespace',
      rows: rows.map((row: any) => ({
        namespace: row.children[0].children[0].value.slice(0, -2),
        consumers: row.children[1].children.filter((child: any) => child.type === 'inlineCode').map((child: any) => child.value),
      }))
    }
  }
  return { kind: 'table', label: cells.map((cell: any) => cell.children.map((child: any) => child.value ?? '').join('')).join(', '), comparison: cells.length === 2 }
}

/** Fenced code: a long declaration, a Generated CSS output, or a complete schema/help disclosure. */
export function referenceCodeWrapper(node: any) {
  if (node.lang === 'typescript' && node.meta === 'declaration') return { kind: 'declaration' as const }
  const disclosure = node.meta?.match(/\bdisclosure=(input-schema|output-schema|command-help)\b/)?.[1] as 'input-schema' | 'output-schema' | 'command-help' | undefined
  const titles = { 'input-schema': 'Complete input schema', 'output-schema': 'Complete output schema', 'command-help': 'Complete command help' }
  if (/\bdisclosure=generated-css\b/.test(node.meta ?? '')) return { kind: 'generated-css' as const }
  return disclosure ? { kind: 'disclosure' as const, title: titles[disclosure] } : undefined
}
