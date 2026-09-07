import type {
  MasterCSSBindingLoadOptions,
  MasterCSSToolingBinding
} from './tooling-binding-contract'
import { createWasmToolingBinding } from './tooling-binding-wasm'
import { normalizeBindingError } from './normalize-error'
import { shouldLoadMasterCSSNativeBinding } from './binding-options'

async function loadNativeToolingFactory() {
  const nodeToolingModule = import.meta.url.endsWith('.ts')
    ? './tooling-binding-native.ts'
    : './tooling-binding-native.js'
  return await import(/* @vite-ignore */ nodeToolingModule) as typeof import('./tooling-binding-native')
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

export async function createToolingBinding(
  options: MasterCSSBindingLoadOptions = {}
): Promise<MasterCSSToolingBinding> {
  try {
    if (shouldLoadMasterCSSNativeBinding(options.binding)) {
      const {
        asAsyncToolingBinding,
        createNativeToolingBinding
      } = await loadNativeToolingFactory()
      const native = createNativeToolingBinding(
        options.native ?? {},
        options.binding === 'native'
      )
      if (native) return asAsyncToolingBinding(native)
    }
    return await createWasmToolingBinding(options.wasm)
  } catch (cause) {
    throw normalizeBindingError(cause, 'tooling')
  }
}
