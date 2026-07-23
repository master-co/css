import { MasterCSSError } from '@master/css-schema'
import { createMasterCSSToolingWasmProvider } from '@master/css-wasm-tooling'
import type {
  MasterCSSBackendLoadOptions,
  MasterCSSToolingBackend
} from './broker-tooling-contract'
import { createWasmToolingBackend } from './broker-tooling-wasm'
import { callBackendAsync } from './normalize-error'

export {
  MASTER_CSS_LANGUAGE_BATCH_VERSION,
  MASTER_CSS_LEXER_BATCH_VERSION,
  MASTER_CSS_LINT_BATCH_VERSION,
  MASTER_CSS_SOURCE_BATCH_VERSION,
  MASTER_CSS_VALIDATOR_BATCH_VERSION
} from './protocol'
export type {
  MasterCSSBackendLoadOptions,
  MasterCSSLexerBackendSession,
  MasterCSSLintBackendSession,
  MasterCSSLanguageBackendSession,
  MasterCSSNativeBackendLoadOptions,
  MasterCSSScannerBackendSession,
  MasterCSSSourceBackendSession,
  MasterCSSToolingBackend,
  MasterCSSToolingBackendSession,
  MasterCSSValidatorBackendSession,
  MasterCSSWasmBackendLoadOptions
} from './broker-tooling-contract'
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

export function createToolingBackend(
  options: MasterCSSBackendLoadOptions = {}
): Promise<MasterCSSToolingBackend> {
  if (options.backend === 'native') {
    throw new MasterCSSError({
      code: 'NATIVE_UNAVAILABLE',
      domain: 'backend',
      message: 'Master CSS native tooling bindings are unavailable in browsers.'
    })
  }
  return callBackendAsync(
    'tooling',
    () => createWasmToolingBackend(
      options.wasm,
      createMasterCSSToolingWasmProvider
    )
  )
}
