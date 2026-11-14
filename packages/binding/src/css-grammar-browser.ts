import {
  cssGrammarUnavailable,
  registeredCSSGrammar,
  type MasterCSSGrammar
} from './css-grammar-contract'

export { MASTER_CSS_GRAMMAR_DATA, registerCSSGrammar } from './css-grammar-contract'
export type {
  MasterCSSGrammar,
  MasterCSSGrammarDeclaration,
  MasterCSSGrammarError,
  MasterCSSGrammarProvider,
  MasterCSSGrammarStatus
} from './css-grammar-contract'

/** The CSS grammar of the compiler or tooling Wasm binding a host initialized. */
export function cssGrammar(): MasterCSSGrammar {
  const registered = registeredCSSGrammar()
  if (!registered) throw cssGrammarUnavailable()
  return registered
}
