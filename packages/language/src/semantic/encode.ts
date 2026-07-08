import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { SemanticTokens } from 'vscode-languageserver-protocol'
import { SEMANTIC_TOKEN_MODIFIERS, SEMANTIC_TOKEN_TYPES } from '../common'
import type { SemanticTokenItem, SemanticTokenModifier } from './types'

const tokenTypeIndex = new Map(SEMANTIC_TOKEN_TYPES.map((type, index) => [type, index]))
const tokenModifierIndex = new Map(SEMANTIC_TOKEN_MODIFIERS.map((modifier, index) => [modifier, index]))

function modifierBits(modifiers: SemanticTokenModifier[] = []) {
  let bits = 0
  for (const modifier of modifiers) {
    const index = tokenModifierIndex.get(modifier)
    if (index !== undefined) bits |= 1 << index
  }
  return bits
}

export function encodeSemanticTokens(document: TextDocument, tokens: SemanticTokenItem[]): SemanticTokens {
  const data: number[] = []
  let previousLine = 0
  let previousCharacter = 0
  let previousEnd = -1
  for (const token of tokens
    .filter((token) => token.end > token.start)
    .sort((a, b) => a.start - b.start || a.end - b.end)) {
    if (token.start < previousEnd) continue
    const typeIndex = tokenTypeIndex.get(token.type)
    if (typeIndex === undefined) continue
    const startPosition = document.positionAt(token.start)
    const endPosition = document.positionAt(token.end)
    if (startPosition.line !== endPosition.line) continue
    data.push(
      startPosition.line - previousLine,
      startPosition.line === previousLine ? startPosition.character - previousCharacter : startPosition.character,
      endPosition.character - startPosition.character,
      typeIndex,
      modifierBits(token.modifiers)
    )
    previousLine = startPosition.line
    previousCharacter = startPosition.character
    previousEnd = token.end
  }
  return { data }
}
