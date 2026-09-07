import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSBindingLoadOptions,
  MasterCSSNativeBindingLoadOptions,
  MasterCSSWasmBindingLoadOptions
} from './binding-options'
import type {
  MasterCSSDiagnosticsReportInput,
  MasterCSSEngineTransition,
  MasterCSSInspectionReport,
  MasterCSSLexerBatch,
  MasterCSSLexerBatchRequest,
  MasterCSSLintBatch,
  MasterCSSLintCanonicalClassGroupSuggestions,
  MasterCSSLintCanonicalClassNameOptions,
  MasterCSSLintCanonicalClassSuggestions,
  MasterCSSLintCanonicalComposeDirective,
  MasterCSSLintClassList,
  MasterCSSLintClassListPolicyRequest,
  MasterCSSLintHostValidation,
  MasterCSSLintRawValueCandidates,
  MasterCSSLanguageClassifications,
  MasterCSSLanguageColorCandidateInput,
  MasterCSSLanguageColorPresentation,
  MasterCSSLanguageColorTokens,
  MasterCSSLanguageCompletionIndex,
  MasterCSSLanguageDocument,
  MasterCSSLanguageDocumentRequest,
  MasterCSSLanguageFormatEdits,
  MasterCSSLanguageFormatRequest,
  MasterCSSLanguageInspection,
  MasterCSSNativeDeclarationCandidate,
  MasterCSSRegex,
  MasterCSSResolvedBinding,
  MasterCSSScannerState,
  MasterCSSScannerUpdate,
  MasterCSSSourceBatch,
  MasterCSSSourceBatchRequest,
  MasterCSSValidatorBatch
} from './protocol'

export type {
  MasterCSSBindingLoadOptions,
  MasterCSSNativeBindingLoadOptions,
  MasterCSSWasmBindingLoadOptions
} from './binding-options'

export interface MasterCSSToolingBindingSession extends Disposable {
  dispose(): void
}

export interface MasterCSSLexerBindingSession extends MasterCSSToolingBindingSession {
  analyze(request: MasterCSSLexerBatchRequest): MasterCSSLexerBatch
}

export interface MasterCSSSourceBindingSession extends MasterCSSToolingBindingSession {
  extract(request: MasterCSSSourceBatchRequest): MasterCSSSourceBatch
}

export interface MasterCSSValidatorBindingSession extends MasterCSSToolingBindingSession {
  nativeDeclarationCandidates(
    classNames: readonly string[]
  ): readonly MasterCSSNativeDeclarationCandidate[]
  generateClassRules(
    classNames: readonly string[],
    nativeSupport?: readonly boolean[]
  ): MasterCSSValidatorBatch
}

export interface MasterCSSLanguageBindingSession extends MasterCSSToolingBindingSession {
  analyzeDocument(request: MasterCSSLanguageDocumentRequest): MasterCSSLanguageDocument
  formatDirectives(request: MasterCSSLanguageFormatRequest): MasterCSSLanguageFormatEdits
  nativeDeclarationCandidates(
    classNames: readonly string[]
  ): readonly MasterCSSNativeDeclarationCandidate[]
  classifyClassNames(
    classNames: readonly string[],
    nativeSupport?: readonly boolean[]
  ): MasterCSSLanguageClassifications
  inspectClassName(
    className: string,
    nativeSupport?: readonly boolean[],
    mode?: string
  ): MasterCSSLanguageInspection
  completionIndex(): MasterCSSLanguageCompletionIndex
  colorPresentation(colorToken: string): MasterCSSLanguageColorPresentation
  colorTokens(candidates: readonly MasterCSSLanguageColorCandidateInput[]): MasterCSSLanguageColorTokens
}

export interface MasterCSSLintBindingSession extends MasterCSSToolingBindingSession {
  nativeDeclarationCandidates(
    classNames: readonly string[]
  ): readonly MasterCSSNativeDeclarationCandidate[]
  resolveValidation(
    batch: MasterCSSValidatorBatch,
    ruleErrors: readonly (readonly (readonly string[])[])[]
  ): MasterCSSLintHostValidation
  canonicalClassNames(
    classNames: readonly string[],
    nativeSupport: readonly boolean[] | undefined,
    options?: Partial<MasterCSSLintCanonicalClassNameOptions>
  ): MasterCSSLintCanonicalClassSuggestions
  canonicalClassGroups(
    classNames: readonly string[],
    nativeSupport: readonly boolean[] | undefined,
    options?: Partial<MasterCSSLintCanonicalClassNameOptions>
  ): MasterCSSLintCanonicalClassGroupSuggestions
  canonicalComposeDirective(
    classNames: readonly string[],
    nativeSupport: readonly boolean[] | undefined,
    options?: Partial<MasterCSSLintCanonicalClassNameOptions>
  ): MasterCSSLintCanonicalComposeDirective
  rawValueCandidates(
    classNames: readonly string[],
    nativeSupport: readonly boolean[] | undefined,
    invalidGeneratedClasses: readonly string[]
  ): MasterCSSLintRawValueCandidates
  analyze(
    classNames: readonly string[],
    nativeSupport: readonly boolean[] | undefined,
    invalidGeneratedClasses: readonly string[]
  ): MasterCSSLintBatch
  analyzeClassList(
    classList: string,
    classNames: readonly string[],
    nativeSupport: readonly boolean[] | undefined,
    invalidGeneratedClasses: readonly string[]
  ): MasterCSSLintBatch
  analyzeClassListPolicy(request: MasterCSSLintClassListPolicyRequest): MasterCSSLintClassList
}

export interface MasterCSSScannerBindingSession extends MasterCSSToolingBindingSession {
  scan(source: string, content: string): MasterCSSScannerUpdate
  extractCandidates(source: string, content: string): readonly string[]
  nativeDeclarationCandidates(
    candidates: readonly string[]
  ): readonly MasterCSSNativeDeclarationCandidate[]
  collectCandidates(candidates: readonly string[]): readonly string[]
  filterCandidates(
    candidates: readonly string[],
    blocklist: readonly (string | MasterCSSRegex)[]
  ): readonly string[]
  invalidGeneratedClasses(
    batch: MasterCSSValidatorBatch,
    ruleSupport: readonly (readonly boolean[])[]
  ): readonly string[]
  scanCandidates(
    source: string,
    content: string,
    candidates: readonly string[],
    blocklist: readonly (string | MasterCSSRegex)[],
    nativeSupport: readonly boolean[],
    invalidGeneratedClasses: readonly string[]
  ): MasterCSSScannerUpdate
  ensureClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  registerNativeClassNames(classNames: readonly string[]): boolean
  reset(): void
  snapshot(): MasterCSSScannerState
}

export interface MasterCSSToolingBinding {
  readonly binding: MasterCSSResolvedBinding
  createLexerSession(): Promise<MasterCSSLexerBindingSession>
  createSourceSession(): Promise<MasterCSSSourceBindingSession>
  createValidatorSession(manifest: MasterCSSManifest): Promise<MasterCSSValidatorBindingSession>
  createLanguageSession(manifest: MasterCSSManifest): Promise<MasterCSSLanguageBindingSession>
  createLintSession(manifest: MasterCSSManifest): Promise<MasterCSSLintBindingSession>
  createScannerSession(manifest: MasterCSSManifest): Promise<MasterCSSScannerBindingSession>
  extractClassCandidates(content: string): readonly string[]
  extractOxcClasses(source: string, content: string): readonly string[]
  extractHTMLClasses(source: string, content: string): readonly string[]
  extractAstroClasses(source: string, content: string): readonly string[]
  createInspectionReport(input: MasterCSSDiagnosticsReportInput): Promise<MasterCSSInspectionReport>
}

export interface MasterCSSToolingBindingSync {
  readonly binding: 'native'
  createLexerSession(): MasterCSSLexerBindingSession
  createSourceSession(): MasterCSSSourceBindingSession
  createValidatorSession(manifest: MasterCSSManifest): MasterCSSValidatorBindingSession
  createLanguageSession(manifest: MasterCSSManifest): MasterCSSLanguageBindingSession
  createLintSession(manifest: MasterCSSManifest): MasterCSSLintBindingSession
  createScannerSession(manifest: MasterCSSManifest): MasterCSSScannerBindingSession
  extractClassCandidates(content: string): readonly string[]
  extractOxcClasses(source: string, content: string): readonly string[]
  extractHTMLClasses(source: string, content: string): readonly string[]
  extractAstroClasses(source: string, content: string): readonly string[]
  createInspectionReport(input: MasterCSSDiagnosticsReportInput): MasterCSSInspectionReport
}
