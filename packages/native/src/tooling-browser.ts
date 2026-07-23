import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSNativeModuleOptions } from './engine-contract'
import type { MasterCSSNativeToolingBackend } from './tooling'

export type {
  MasterCSSNativeLanguageSession,
  MasterCSSNativeLexerSession,
  MasterCSSNativeLintSession,
  MasterCSSNativeScannerSession,
  MasterCSSNativeSourceSession,
  MasterCSSNativeToolingBackend,
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
  type MasterCSSEngineSnapshotIR,
  type MasterCSSEngineTransitionIR,
  type MasterCSSLexerBatchIR,
  type MasterCSSLexerBatchRequestIR,
  type MasterCSSLexerClassListInputIR,
  type MasterCSSLexerClassListItemIR,
  type MasterCSSLexerCSSAnalysisIR,
  type MasterCSSLexerCSSDirectiveIR,
  type MasterCSSLexerCSSImportIR,
  type MasterCSSLintBatchIR,
  type MasterCSSLintCanonicalClassGroupSuggestionIR,
  type MasterCSSLintCanonicalClassGroupSuggestionsIR,
  type MasterCSSLintCanonicalClassNameOptionsIR,
  type MasterCSSLintCanonicalClassSuggestionIR,
  type MasterCSSLintCanonicalClassSuggestionsIR,
  type MasterCSSLintCanonicalComposeDirectiveIR,
  type MasterCSSLintCanonicalComposeSuggestionIR,
  type MasterCSSLintCanonicalComposeSuggestionKind,
  type MasterCSSLintClassConflictIR,
  type MasterCSSLintClassListIR,
  type MasterCSSLintDiagnosticIR,
  type MasterCSSLintEditIR,
  type MasterCSSLintPartialClassConflictIR,
  type MasterCSSLintRawValueCandidateIR,
  type MasterCSSLintRawValueCandidatesIR,
  type MasterCSSLanguageClassificationsIR,
  type MasterCSSLanguageClassIR,
  type MasterCSSLanguageClassKind,
  type MasterCSSLanguageClassVariableIR,
  type MasterCSSLanguageColorCandidateInputIR,
  type MasterCSSLanguageColorPresentationIR,
  type MasterCSSLanguageColorTokenIR,
  type MasterCSSLanguageColorTokensIR,
  type MasterCSSLanguageCompletionEntryIR,
  type MasterCSSLanguageCompletionIndexIR,
  type MasterCSSLanguageCompletionKind,
  type MasterCSSLanguageInspectionIR,
  type MasterCSSLanguageVariableIR,
  type MasterCSSNativeDeclarationCandidateIR,
  type MasterCSSRegexIR,
  type MasterCSSSourceBatchIR,
  type MasterCSSSourceBatchRequestIR,
  type MasterCSSSourceExtractionInputIR,
  type MasterCSSSourceExtractionIR,
  type MasterCSSSourceExtractorKind,
  type MasterCSSSourceRange,
  type MasterCSSValidatorBatchIR,
  type MasterCSSValidatorClassIR
} from './protocol'

export function loadNativeToolingBackend(
  moduleOptions: MasterCSSNativeModuleOptions = {}
): MasterCSSNativeToolingBackend | undefined {
  if (!moduleOptions.required) return
  throw new MasterCSSError({
    code: 'NATIVE_UNAVAILABLE',
    domain: 'backend',
    message: 'Master CSS native tooling bindings are unavailable in browsers.'
  })
}
