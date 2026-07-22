import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { SemanticTokens } from 'vscode-languageserver-protocol'
import { encodeSemanticTokens } from './semantic/encode'
import { toSemanticTokenItems, type HighlightTokenItem } from './semantic/highlight'
import { collectCSSHighlightTokenItems, isCSSSemanticTokenDocument } from './semantic/tokenize-css'
import { tokenizeClassToken } from './semantic/tokenize-class'
import type { SemanticTokenItem } from './semantic/types'
import type { MasterCSS } from './master-css'
import type { ClassPosition } from './utils/get-class-positions'
import type { RustLanguageAnalyzer } from './rust-session'

export { encodeSemanticTokens }
export type { HighlightTokenItem, SemanticTokenItem }

export interface RenderSemanticTokenOptions {
  embeddedSyntaxHighlighting?: 'active' | 'always' | 'off'
  analyzer?: RustLanguageAnalyzer
}

function encodeHighlightTokens(
  document: TextDocument,
  highlightTokens: HighlightTokenItem[],
  analyzer?: RustLanguageAnalyzer
): SemanticTokens | undefined {
  if (!highlightTokens.length) return
  const semanticTokens = toSemanticTokenItems(highlightTokens)
  return analyzer
    ? { data: analyzer.analyze(document.getText(), [], semanticTokens).semanticTokenData }
    : encodeSemanticTokens(document, semanticTokens)
}

export function collectEmbeddedHighlightTokenItems(css: MasterCSS, classPositions: ClassPosition[]): HighlightTokenItem[] {
  const semanticTokens: HighlightTokenItem[] = []
  for (const classPosition of classPositions) {
    if (!classPosition.raw) continue
    semanticTokens.push(...tokenizeClassToken(css, classPosition.token, classPosition.range.start))
  }
  return semanticTokens
}

export function collectCSSDocumentHighlightTokenItems(css: MasterCSS, document: TextDocument, options: Parameters<typeof collectCSSHighlightTokenItems>[3] = {}): HighlightTokenItem[] {
  return collectCSSHighlightTokenItems(document.getText(), css, document.languageId, options)
}

export function collectHighlightTokenItems(css: MasterCSS, document: TextDocument, classPositions: ClassPosition[]): HighlightTokenItem[] {
  if (isCSSSemanticTokenDocument(document.languageId)) {
    return collectCSSDocumentHighlightTokenItems(css, document)
  }

  return [
    ...collectEmbeddedHighlightTokenItems(css, classPositions),
    ...collectCSSDocumentHighlightTokenItems(css, document)
  ]
}

export function collectSemanticTokenItems(css: MasterCSS, document: TextDocument, classPositions: ClassPosition[]): SemanticTokenItem[] {
  return toSemanticTokenItems(collectHighlightTokenItems(css, document, classPositions))
}

export function collectDocumentHighlightTokenItems(css: MasterCSS, document: TextDocument, classPositions: ClassPosition[], options: RenderSemanticTokenOptions = {}): HighlightTokenItem[] {
  const semanticTokens = collectCSSDocumentHighlightTokenItems(css, document)
  if (options.embeddedSyntaxHighlighting === 'always' && !isCSSSemanticTokenDocument(document.languageId)) {
    semanticTokens.push(...collectEmbeddedHighlightTokenItems(css, classPositions))
  }
  return semanticTokens
}

export function collectDocumentSemanticTokenItems(css: MasterCSS, document: TextDocument, classPositions: ClassPosition[], options: RenderSemanticTokenOptions = {}): SemanticTokenItem[] {
  return toSemanticTokenItems(collectDocumentHighlightTokenItems(css, document, classPositions, options))
}

export function collectActiveHighlightTokenItems(css: MasterCSS, document: TextDocument, classPositions: ClassPosition[], position: Parameters<TextDocument['offsetAt']>[0], options: RenderSemanticTokenOptions = {}): HighlightTokenItem[] {
  if (options.embeddedSyntaxHighlighting !== 'off' && !isCSSSemanticTokenDocument(document.languageId) && classPositions.length) {
    return collectEmbeddedHighlightTokenItems(css, classPositions)
  }
  return collectCSSDocumentHighlightTokenItems(css, document, {
    positionOffset: document.offsetAt(position)
  })
}

export function renderSemanticTokensAtPosition(css: MasterCSS, document: TextDocument, classPositions: ClassPosition[], position: Parameters<TextDocument['offsetAt']>[0], options: RenderSemanticTokenOptions = {}): SemanticTokens | undefined {
  return encodeHighlightTokens(
    document,
    collectActiveHighlightTokenItems(css, document, classPositions, position, options),
    options.analyzer
  )
}

export default function renderSemanticTokens(css: MasterCSS, document: TextDocument, classPositions: ClassPosition[], options: RenderSemanticTokenOptions = {}): SemanticTokens | undefined {
  return encodeHighlightTokens(
    document,
    collectDocumentHighlightTokenItems(css, document, classPositions, options),
    options.analyzer
  )
}
