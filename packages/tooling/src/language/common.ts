import { AT_SIGN, DELIMITER_SIGN, QUERY_COMPARISON_OPERATORS, QUERY_LOGICAL_OPERATORS, SELECTOR_SIGNS, SEPARATOR_SIGN } from './master-css'

export const INVOKED_TRIGGER_CHARACTERS = ['"', ' ', '\'']
export const VALUE_TRIGGER_CHARACTERS = [SEPARATOR_SIGN, DELIMITER_SIGN]
export const SELECTOR_TRIGGER_CHARACTERS = SELECTOR_SIGNS
export const AT_TRIGGER_CHARACTER = AT_SIGN
export const QUERY_TRIGGER_CHARACTERS = [...QUERY_COMPARISON_OPERATORS, ...QUERY_LOGICAL_OPERATORS]
export const GROUP_TRIGGER_CHARACTER = '{'
export const DECLARATION_SEPARATOR_TRIGGER_CHARACTER = ';'
export const SEMANTIC_TOKEN_TYPES = [
  'class',
  'enumMember',
  'property',
  'variable',
  'function',
  'number',
  'string',
  'keyword',
  'modifier',
  'operator',
  'type'
] as const
export const SEMANTIC_TOKEN_MODIFIERS = [
  'declaration',
  'defaultLibrary',
  'component',
  'directive',
  'important',
  'pseudoClass',
  'pseudoElement',
  'query',
  'quoted',
  'selector',
  'unit',
  'blockBrace',
  'declarationSeparator',
  'declarationTerminator',
  'directiveTerminator',
  'functionPunctuation',
  'valueSeparator',
  'valueOperator',
  'queryOperator',
  'queryPunctuation',
  'selectorCombinator',
  'selectorPunctuation',
  'pseudoClassDelimiter',
  'pseudoElementDelimiter'
] as const
export const SEMANTIC_TOKENS_LEGEND = {
  tokenTypes: [...SEMANTIC_TOKEN_TYPES],
  tokenModifiers: [...SEMANTIC_TOKEN_MODIFIERS]
}
