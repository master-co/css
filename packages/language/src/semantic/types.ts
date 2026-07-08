import { SEMANTIC_TOKEN_MODIFIERS, SEMANTIC_TOKEN_TYPES } from '../common'

export type SemanticTokenType = typeof SEMANTIC_TOKEN_TYPES[number]
export type SemanticTokenModifier = typeof SEMANTIC_TOKEN_MODIFIERS[number]

export interface SemanticTokenItem {
  start: number
  end: number
  type: SemanticTokenType
  modifiers?: SemanticTokenModifier[]
}

export function pushToken(
  tokens: SemanticTokenItem[],
  start: number,
  length: number,
  type: SemanticTokenType,
  modifiers?: SemanticTokenModifier[]
) {
  if (length <= 0) return
  tokens.push({ start, end: start + length, type, modifiers })
}
