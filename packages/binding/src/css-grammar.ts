import {
  cssGrammarUnavailable,
  registeredCSSGrammar,
  type MasterCSSGrammar
} from './css-grammar-contract'
import { loadNativeBinding, registerNativeCSSGrammar } from './native-loader'

export { MASTER_CSS_GRAMMAR_DATA, registerCSSGrammar } from './css-grammar-contract'
export type {
  MasterCSSGrammar,
  MasterCSSGrammarDeclaration,
  MasterCSSGrammarError,
  MasterCSSGrammarProvider,
  MasterCSSGrammarStatus
} from './css-grammar-contract'

/**
 * The CSS grammar of the binding the host loaded first; without one, loading the
 * native binding registers its grammar.
 */
export function cssGrammar(): MasterCSSGrammar {
  const registered = registeredCSSGrammar()
  if (registered) return registered
  const native = loadNativeBinding()
  if (native) registerNativeCSSGrammar(native.binding)
  const loaded = registeredCSSGrammar()
  if (!loaded) throw cssGrammarUnavailable()
  return loaded
}
