import type { MasterCSSLanguageService } from '../core'
import {
  SEMANTIC_TOKEN_MODIFIERS,
  SEMANTIC_TOKEN_TYPES,
  type SemanticTokenItem
} from '@master/css-tooling/language'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { SemanticTokens } from 'vscode-languageserver-protocol'

const CSS_LANGUAGE_IDS = new Set(['css', 'scss'])

function analyzeDocument(service: MasterCSSLanguageService, document: TextDocument) {
  return service.session.analyzeDocument({
    source: document.getText(),
    languageId: document.languageId,
    settings: {
      classAttributes: service.settings.classAttributes,
      classFunctions: service.settings.classFunctions,
      classDeclarations: service.settings.classDeclarations
    }
  })
}

function encodeSemanticTokens(document: TextDocument, tokens: readonly SemanticTokenItem[]): number[] {
  const data: number[] = []
  let previousLine = 0
  let previousCharacter = 0
  for (const token of [...tokens].sort((left, right) => left.start - right.start || left.end - right.end)) {
    const start = document.positionAt(token.start)
    const deltaLine = start.line - previousLine
    const deltaCharacter = deltaLine === 0 ? start.character - previousCharacter : start.character
    const tokenType = SEMANTIC_TOKEN_TYPES.indexOf(token.type)
    const modifiers = (token.modifiers || []).reduce((bits, modifier) => {
      const index = SEMANTIC_TOKEN_MODIFIERS.indexOf(modifier)
      return index < 0 ? bits : bits | (1 << index)
    }, 0)
    data.push(deltaLine, deltaCharacter, token.end - token.start, tokenType, modifiers)
    previousLine = start.line
    previousCharacter = start.character
  }
  return data
}

export function renderSemanticTokensAtPosition(
  this: MasterCSSLanguageService,
  document: TextDocument,
  position: Parameters<MasterCSSLanguageService['getClassPosition']>[1]
): SemanticTokens | undefined {
  if (this.settings.embeddedSyntaxHighlighting === 'off') return
  const classPosition = this.getClassPosition(document, position)
  if (!classPosition) return
  const result = analyzeDocument(this, document)
  const semanticTokens = result.semanticTokens.filter(({ start, end }) =>
    start >= classPosition.contextRange.start && end <= classPosition.contextRange.end
  )
  const data = encodeSemanticTokens(document, semanticTokens)
  return data.length ? { data } : undefined
}

export default function renderSemanticTokens(
  this: MasterCSSLanguageService,
  document: TextDocument
): SemanticTokens | undefined {
  if (
    this.settings.embeddedSyntaxHighlighting !== 'always'
    && !CSS_LANGUAGE_IDS.has(document.languageId)
  ) return
  const result = analyzeDocument(this, document)
  return result.semanticTokenData.length ? { data: [...result.semanticTokenData] } : undefined
}
