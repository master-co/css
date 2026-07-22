import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { SemanticTokens } from 'vscode-languageserver-protocol'
import { tokenizeMasterCSSGroupedClassToken } from '@master/css-lexer'
import { encodeSemanticTokens } from './semantic/encode'
import { toSemanticTokenItems, type HighlightTokenItem } from './semantic/highlight'
import {
  collectCSSDirectiveClassNames,
  collectCSSHighlightTokenItems,
  isCSSSemanticTokenDocument
} from './semantic/tokenize-css'
import { tokenizeClassToken } from './semantic/tokenize-class'
import type { MasterCSSLanguageTokenClassification } from './semantic/tokenize-class'
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

function collectClassificationNames(token: string, names: Set<string>) {
  const grouped = tokenizeMasterCSSGroupedClassToken(token, 0, (partText) => {
    collectClassificationNames(partText, names)
    return []
  })
  if (!grouped && !token.startsWith('@')) names.add(token)
}

function classifyClassPositions(
  classPositions: ClassPosition[],
  analyzer?: RustLanguageAnalyzer,
  additionalNames: string[] = []
): ReadonlyMap<string, MasterCSSLanguageTokenClassification> | undefined {
  if (!analyzer?.classifyClassNames) return
  const names = new Set(additionalNames)
  for (const { token } of classPositions) collectClassificationNames(token, names)
  if (!names.size) return new Map()
  const classifications = analyzer.classifyClassNames([...names])
  const variableNames = new Set(classifications.variableNames)
  return new Map(classifications.classes.map((item) => [item.className, {
    ...item,
    variableNames
  }]))
}

export function collectEmbeddedHighlightTokenItems(
  css: MasterCSS | undefined,
  classPositions: ClassPosition[],
  analyzer?: RustLanguageAnalyzer
): HighlightTokenItem[] {
  const semanticTokens: HighlightTokenItem[] = []
  const classifications = classifyClassPositions(classPositions, analyzer)
  for (const classPosition of classPositions) {
    if (!classPosition.raw) continue
    semanticTokens.push(...tokenizeClassToken(
      css,
      classPosition.token,
      classPosition.range.start,
      classifications
    ))
  }
  return semanticTokens
}

export function collectCSSDocumentHighlightTokenItems(
  css: MasterCSS | undefined,
  document: TextDocument,
  options: Parameters<typeof collectCSSHighlightTokenItems>[3] = {},
  classPositions: ClassPosition[] = [],
  analyzer?: RustLanguageAnalyzer
): HighlightTokenItem[] {
  const source = document.getText()
  const classifications = isCSSSemanticTokenDocument(document.languageId)
    ? classifyClassPositions(
      classPositions,
      analyzer,
      collectCSSDirectiveClassNames(source, document.languageId, options)
    )
    : undefined
  return collectCSSHighlightTokenItems(
    source,
    css,
    document.languageId,
    options,
    classifications
  )
}

export function collectHighlightTokenItems(
  css: MasterCSS | undefined,
  document: TextDocument,
  classPositions: ClassPosition[],
  analyzer?: RustLanguageAnalyzer
): HighlightTokenItem[] {
  if (isCSSSemanticTokenDocument(document.languageId)) {
    return collectCSSDocumentHighlightTokenItems(css, document, {}, classPositions, analyzer)
  }

  return [
    ...collectEmbeddedHighlightTokenItems(css, classPositions, analyzer),
    ...collectCSSDocumentHighlightTokenItems(css, document)
  ]
}

export function collectSemanticTokenItems(
  css: MasterCSS | undefined,
  document: TextDocument,
  classPositions: ClassPosition[],
  analyzer?: RustLanguageAnalyzer
): SemanticTokenItem[] {
  return toSemanticTokenItems(collectHighlightTokenItems(css, document, classPositions, analyzer))
}

export function collectDocumentHighlightTokenItems(css: MasterCSS | undefined, document: TextDocument, classPositions: ClassPosition[], options: RenderSemanticTokenOptions = {}): HighlightTokenItem[] {
  const semanticTokens = collectCSSDocumentHighlightTokenItems(
    css,
    document,
    {},
    classPositions,
    options.analyzer
  )
  if (options.embeddedSyntaxHighlighting === 'always' && !isCSSSemanticTokenDocument(document.languageId)) {
    semanticTokens.push(...collectEmbeddedHighlightTokenItems(css, classPositions, options.analyzer))
  }
  return semanticTokens
}

export function collectDocumentSemanticTokenItems(css: MasterCSS | undefined, document: TextDocument, classPositions: ClassPosition[], options: RenderSemanticTokenOptions = {}): SemanticTokenItem[] {
  return toSemanticTokenItems(collectDocumentHighlightTokenItems(css, document, classPositions, options))
}

export function collectActiveHighlightTokenItems(css: MasterCSS | undefined, document: TextDocument, classPositions: ClassPosition[], position: Parameters<TextDocument['offsetAt']>[0], options: RenderSemanticTokenOptions = {}): HighlightTokenItem[] {
  if (options.embeddedSyntaxHighlighting !== 'off' && !isCSSSemanticTokenDocument(document.languageId) && classPositions.length) {
    return collectEmbeddedHighlightTokenItems(css, classPositions, options.analyzer)
  }
  return collectCSSDocumentHighlightTokenItems(
    css,
    document,
    { positionOffset: document.offsetAt(position) },
    classPositions,
    options.analyzer
  )
}

export function renderSemanticTokensAtPosition(css: MasterCSS | undefined, document: TextDocument, classPositions: ClassPosition[], position: Parameters<TextDocument['offsetAt']>[0], options: RenderSemanticTokenOptions = {}): SemanticTokens | undefined {
  return encodeHighlightTokens(
    document,
    collectActiveHighlightTokenItems(css, document, classPositions, position, options),
    options.analyzer
  )
}

export default function renderSemanticTokens(css: MasterCSS | undefined, document: TextDocument, classPositions: ClassPosition[], options: RenderSemanticTokenOptions = {}): SemanticTokens | undefined {
  return encodeHighlightTokens(
    document,
    collectDocumentHighlightTokenItems(css, document, classPositions, options),
    options.analyzer
  )
}
