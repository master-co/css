import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSNativeModuleOptions } from './engine-contract'
import type { MasterCSSNativeToolingBinding } from './tooling'

export type {
  MasterCSSNativeLanguageSession,
  MasterCSSNativeLexerSession,
  MasterCSSNativeLintSession,
  MasterCSSNativeScannerSession,
  MasterCSSNativeSourceSession,
  MasterCSSNativeToolingBinding,
  MasterCSSNativeToolingSession,
  MasterCSSNativeValidatorSession
} from './tooling'
export type { MasterCSSNativeModuleOptions } from './engine-contract'
export {
  MASTER_CSS_LANGUAGE_BATCH_VERSION,
  MASTER_CSS_LEXER_BATCH_VERSION,
  MASTER_CSS_LINT_BATCH_VERSION,
  MASTER_CSS_SOURCE_BATCH_VERSION,
  MASTER_CSS_VALIDATOR_BATCH_VERSION,
  type MasterCSSEngineSnapshot,
  type MasterCSSEngineTransition,
  type MasterCSSLexerBatch,
  type MasterCSSLexerBatchRequest,
  type MasterCSSLexerClassListInput,
  type MasterCSSLexerClassListItem,
  type MasterCSSLexerCSSAnalysis,
  type MasterCSSLexerCSSDirective,
  type MasterCSSLexerCSSImport,
  type MasterCSSLintBatch,
  type MasterCSSLintCanonicalClassGroupSuggestion,
  type MasterCSSLintCanonicalClassGroupSuggestions,
  type MasterCSSLintCanonicalClassNameOptions,
  type MasterCSSLintCanonicalClassSuggestion,
  type MasterCSSLintCanonicalClassSuggestions,
  type MasterCSSLintCanonicalComposeDirective,
  type MasterCSSLintCanonicalComposeSuggestion,
  type MasterCSSLintCanonicalComposeSuggestionKind,
  type MasterCSSLintClassConflict,
  type MasterCSSLintClassList,
  type MasterCSSLintDiagnostic,
  type MasterCSSLintEdit,
  type MasterCSSLintPartialClassConflict,
  type MasterCSSLintRawValueCandidate,
  type MasterCSSLintRawValueCandidates,
  type MasterCSSLanguageClassifications,
  type MasterCSSLanguageClass,
  type MasterCSSLanguageClassKind,
  type MasterCSSLanguageClassVariable,
  type MasterCSSLanguageColorCandidateInput,
  type MasterCSSLanguageColorPresentation,
  type MasterCSSLanguageColorToken,
  type MasterCSSLanguageColorTokens,
  type MasterCSSLanguageCompletionEntry,
  type MasterCSSLanguageCompletionIndex,
  type MasterCSSLanguageCompletionKind,
  type MasterCSSLanguageInspection,
  type MasterCSSLanguageVariable,
  type MasterCSSNativeDeclarationCandidate,
  type MasterCSSRegex,
  type MasterCSSSourceBatch,
  type MasterCSSSourceBatchRequest,
  type MasterCSSSourceExtractionInput,
  type MasterCSSSourceExtraction,
  type MasterCSSSourceExtractorKind,
  type MasterCSSSourceRange,
  type MasterCSSValidatorBatch,
  type MasterCSSValidatorClass
} from './protocol'

export function loadNativeToolingBinding(
  moduleOptions: MasterCSSNativeModuleOptions = {}
): MasterCSSNativeToolingBinding | undefined {
  if (!moduleOptions.required) return
  throw new MasterCSSError({
    code: 'NATIVE_UNAVAILABLE',
    domain: 'binding',
    message: 'Master CSS native tooling bindings are unavailable in browsers.'
  })
}
