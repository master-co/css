import { MasterCSSError } from '@master/css-schema'
import { createMasterCSSToolingWasmProvider } from '@master/css-binding-wasm-tooling'
import type {
  MasterCSSBindingLoadOptions,
  MasterCSSToolingBinding
} from './tooling-binding-contract'
import { createWasmToolingBinding } from './tooling-binding-wasm'
import { callBindingAsync } from './normalize-error'

export {
  MASTER_CSS_LANGUAGE_BATCH_VERSION,
  MASTER_CSS_LEXER_BATCH_VERSION,
  MASTER_CSS_LINT_BATCH_VERSION,
  MASTER_CSS_SOURCE_BATCH_VERSION,
  MASTER_CSS_VALIDATOR_BATCH_VERSION
} from './protocol'
export type {
  MasterCSSBindingLoadOptions,
  MasterCSSLexerBindingSession,
  MasterCSSLintBindingSession,
  MasterCSSLanguageBindingSession,
  MasterCSSNativeBindingLoadOptions,
  MasterCSSScannerBindingSession,
  MasterCSSSourceBindingSession,
  MasterCSSToolingBinding,
  MasterCSSToolingBindingSession,
  MasterCSSValidatorBindingSession,
  MasterCSSWasmBindingLoadOptions
} from './tooling-binding-contract'
export type {
  MasterCSSEngineSnapshot,
  MasterCSSEngineTransition,
  MasterCSSLexerBatch,
  MasterCSSLexerBatchRequest,
  MasterCSSLexerClassListInput,
  MasterCSSLexerClassListItem,
  MasterCSSLexerCSSAnalysis,
  MasterCSSLintBatch,
  MasterCSSLintCanonicalClassGroupSuggestions,
  MasterCSSLintCanonicalClassSuggestions,
  MasterCSSLintCanonicalComposeDirective,
  MasterCSSLintRawValueCandidates,
  MasterCSSLanguageClassifications,
  MasterCSSLanguageInspection,
  MasterCSSNativeDeclarationCandidate,
  MasterCSSSourceBatch,
  MasterCSSSourceBatchRequest,
  MasterCSSSourceExtractorKind,
  MasterCSSSourceRange,
  MasterCSSValidatorBatch
} from './protocol'

export function createToolingBinding(
  options: MasterCSSBindingLoadOptions = {}
): Promise<MasterCSSToolingBinding> {
  if (options.binding === 'native') {
    throw new MasterCSSError({
      code: 'NATIVE_UNAVAILABLE',
      domain: 'binding',
      message: 'Master CSS native tooling bindings are unavailable in browsers.'
    })
  }
  return callBindingAsync(
    'tooling',
    () => createWasmToolingBinding(
      options.wasm,
      createMasterCSSToolingWasmProvider
    )
  )
}
