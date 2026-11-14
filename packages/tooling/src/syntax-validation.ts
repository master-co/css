import { cssGrammar, MASTER_CSS_GRAMMAR_DATA } from '@master/css-binding/css-grammar'
import type { MasterCSSSyntaxStatus } from '@master/css-binding/tooling'

export const CSS_SYNTAX_CHECK = Object.freeze({ ...MASTER_CSS_GRAMMAR_DATA, phase: 'css-syntax' as const, scope: 'selectors-queries-declarations' as const })

/**
 * Token structure is independent of property grammars and browser support; a
 * construct the parser cannot read is incomplete knowledge (`unknown`), not invalid.
 */
export function cssSyntaxStatus(text: string): MasterCSSSyntaxStatus {
  return cssGrammar().syntaxStatus(text)
}
