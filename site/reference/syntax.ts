import { createHash } from 'node:crypto'
import { generateSyntaxTrDeclarations } from '../components/syntax-tr-declarations'
import { createSyntaxTrPlaceholderContext, type SyntaxTrHastNode } from '../components/syntax-tr-placeholders'
import type { SyntaxRow } from './types'

export const syntaxAnchor = (syntax: string) => `syntax-${createHash('sha256').update(syntax).digest('hex').slice(0, 12)}`

/** Presentation examples, not a second grammar or an exhaustive value validator. */
export function resolveSyntaxRow(value: string | string[], previewSyntax?: string): SyntaxRow {
  const syntax = Array.isArray(value) ? value[0] : value
  const placeholders = createSyntaxTrPlaceholderContext()
  const declarations = generateSyntaxTrDeclarations(placeholders.proxy(syntax), previewSyntax)
  const root: SyntaxTrHastNode = {
    type: 'root',
    children: [{ type: 'text', value: Object.entries(declarations).map(([key, value]) => `${key}: ${value};`).join('\n') }]
  }
  placeholders.restoreTextNodes(root)
  const collect = (node: SyntaxTrHastNode): string => node.value ?? node.children?.map(collect).join('') ?? ''
  return {
    id: syntaxAnchor(syntax),
    syntax: syntax.replace(/`([^`]+)`/g, '<$1>'),
    declarations: collect(root),
    identifiers: [...new Set([syntax.split(':')[0] + (syntax.includes(':') ? ':' : ''), ...Object.keys(declarations)])]
  }
}
