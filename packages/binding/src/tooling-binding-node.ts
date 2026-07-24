import type { MasterCSSNativeBindingLoadOptions } from './binding-options'
import type { MasterCSSToolingBindingSync } from './tooling-binding-contract'
import { createNativeToolingBinding } from './tooling-binding-native'
import { normalizeBindingError } from './normalize-error'

export type {
  MasterCSSLexerBindingSession,
  MasterCSSLintBindingSession,
  MasterCSSLanguageBindingSession,
  MasterCSSNativeBindingLoadOptions,
  MasterCSSScannerBindingSession,
  MasterCSSSourceBindingSession,
  MasterCSSToolingBindingSession,
  MasterCSSToolingBindingSync,
  MasterCSSValidatorBindingSession
} from './tooling-binding-contract'

export function createToolingBindingSync(
  options: MasterCSSNativeBindingLoadOptions = {}
): MasterCSSToolingBindingSync {
  try {
    return createNativeToolingBinding(options, true)!
  } catch (cause) {
    throw normalizeBindingError(cause, 'tooling')
  }
}
