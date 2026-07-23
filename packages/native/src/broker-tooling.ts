import type {
  MasterCSSBackendLoadOptions,
  MasterCSSToolingBackend
} from './broker-tooling-contract'
import { createWasmToolingBackend } from './broker-tooling-wasm'
import { normalizeBackendError } from './normalize-error'
import { shouldLoadMasterCSSNativeBackend } from './backend-options'

async function loadNativeToolingFactory() {
  const nodeToolingModule = import.meta.url.endsWith('.ts')
    ? './broker-tooling-native.ts'
    : './broker-tooling-native.js'
  return await import(/* @vite-ignore */ nodeToolingModule) as typeof import('./broker-tooling-native')
}

export {
  MASTER_CSS_LANGUAGE_BATCH_VERSION,
  MASTER_CSS_LEXER_BATCH_VERSION,
  MASTER_CSS_LINT_BATCH_VERSION,
  MASTER_CSS_SOURCE_BATCH_VERSION,
  MASTER_CSS_VALIDATOR_BATCH_VERSION
} from './protocol'
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

export async function createToolingBackend(
  options: MasterCSSBackendLoadOptions = {}
): Promise<MasterCSSToolingBackend> {
  try {
    if (shouldLoadMasterCSSNativeBackend(options.backend)) {
      const {
        asAsyncToolingBackend,
        createNativeToolingBackend
      } = await loadNativeToolingFactory()
      const native = createNativeToolingBackend(
        options.native ?? {},
        options.backend === 'native'
      )
      if (native) return asAsyncToolingBackend(native)
    }
    return await createWasmToolingBackend(options.wasm)
  } catch (cause) {
    throw normalizeBackendError(cause, 'tooling')
  }
}
