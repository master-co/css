import { SEMANTIC_TOKEN_MODIFIERS, SEMANTIC_TOKEN_TYPES } from '../common'

export type SemanticTokenType = typeof SEMANTIC_TOKEN_TYPES[number]
export type SemanticTokenModifier = typeof SEMANTIC_TOKEN_MODIFIERS[number]

export type HighlightTokenRole =
  | 'block.brace'
  | 'declaration.property'
  | 'declaration.separator'
  | 'declaration.terminator'
  | 'query.keyword'
  | 'selector.combinator'
  | 'selector.pseudoClass.delimiter'
  | 'selector.pseudoClass.name'
  | 'selector.pseudoElement.delimiter'
  | 'selector.pseudoElement.name'
  | 'selector.punctuation'
  | 'selector.type'
  | 'utility.component'
  | 'utility.semantic'
  | 'value.important'
  | 'value.keyword'
  | 'value.number'
  | 'value.variable'

export interface SemanticTokenItem {
  start: number
  end: number
  type: SemanticTokenType
  modifiers?: SemanticTokenModifier[]
}
