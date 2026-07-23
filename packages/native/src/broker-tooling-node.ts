import type { MasterCSSNativeBackendLoadOptions } from './backend-options'
import type { MasterCSSToolingBackendSync } from './broker-tooling-contract'
import { createNativeToolingBackend } from './broker-tooling-native'
import { normalizeBackendError } from './normalize-error'

export type {
  MasterCSSLexerBackendSession,
  MasterCSSLintBackendSession,
  MasterCSSLanguageBackendSession,
  MasterCSSNativeBackendLoadOptions,
  MasterCSSScannerBackendSession,
  MasterCSSSourceBackendSession,
  MasterCSSToolingBackendSession,
  MasterCSSToolingBackendSync,
  MasterCSSValidatorBackendSession
} from './broker-tooling-contract'

export function createToolingBackendSync(
  options: MasterCSSNativeBackendLoadOptions = {}
): MasterCSSToolingBackendSync {
  try {
    return createNativeToolingBackend(options, true)!
  } catch (cause) {
    throw normalizeBackendError(cause, 'tooling')
  }
}
