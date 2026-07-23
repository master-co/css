import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSBackendLoadOptions,
  MasterCSSNativeBackendLoadOptions,
  MasterCSSWasmBackendLoadOptions
} from './backend-options'
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
  MasterCSSResolvedBackend,
  MasterCSSScannerState,
  MasterCSSScannerUpdate,
  MasterCSSSourceBatch,
  MasterCSSSourceBatchRequest,
  MasterCSSValidatorBatch
} from './protocol'

export type {
  MasterCSSBackendLoadOptions,
  MasterCSSNativeBackendLoadOptions,
  MasterCSSWasmBackendLoadOptions
} from './backend-options'

export interface MasterCSSToolingBackendSession extends Disposable {
  dispose(): void
}

export interface MasterCSSLexerBackendSession extends MasterCSSToolingBackendSession {
  analyze(request: MasterCSSLexerBatchRequest): MasterCSSLexerBatch
}

export interface MasterCSSSourceBackendSession extends MasterCSSToolingBackendSession {
  extract(request: MasterCSSSourceBatchRequest): MasterCSSSourceBatch
}

export interface MasterCSSValidatorBackendSession extends MasterCSSToolingBackendSession {
  nativeDeclarationCandidates(
    classNames: readonly string[]
  ): readonly MasterCSSNativeDeclarationCandidate[]
  generateClassRules(
    classNames: readonly string[],
    nativeSupport?: readonly boolean[]
  ): MasterCSSValidatorBatch
}

export interface MasterCSSLanguageBackendSession extends MasterCSSToolingBackendSession {
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

export interface MasterCSSLintBackendSession extends MasterCSSToolingBackendSession {
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

export interface MasterCSSScannerBackendSession extends MasterCSSToolingBackendSession {
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

export interface MasterCSSToolingBackend {
  readonly backend: MasterCSSResolvedBackend
  createLexerSession(): Promise<MasterCSSLexerBackendSession>
  createSourceSession(): Promise<MasterCSSSourceBackendSession>
  createValidatorSession(manifest: MasterCSSManifest): Promise<MasterCSSValidatorBackendSession>
  createLanguageSession(manifest: MasterCSSManifest): Promise<MasterCSSLanguageBackendSession>
  createLintSession(manifest: MasterCSSManifest): Promise<MasterCSSLintBackendSession>
  createScannerSession(manifest: MasterCSSManifest): Promise<MasterCSSScannerBackendSession>
  extractClassCandidates(content: string): readonly string[]
  extractOxcClasses(source: string, content: string): readonly string[]
  extractHTMLClasses(source: string, content: string): readonly string[]
  extractAstroClasses(source: string, content: string): readonly string[]
  createInspectionReport(input: MasterCSSDiagnosticsReportInput): Promise<MasterCSSInspectionReport>
}

export interface MasterCSSToolingBackendSync {
  readonly backend: 'native'
  createLexerSession(): MasterCSSLexerBackendSession
  createSourceSession(): MasterCSSSourceBackendSession
  createValidatorSession(manifest: MasterCSSManifest): MasterCSSValidatorBackendSession
  createLanguageSession(manifest: MasterCSSManifest): MasterCSSLanguageBackendSession
  createLintSession(manifest: MasterCSSManifest): MasterCSSLintBackendSession
  createScannerSession(manifest: MasterCSSManifest): MasterCSSScannerBackendSession
  extractClassCandidates(content: string): readonly string[]
  extractOxcClasses(source: string, content: string): readonly string[]
  extractHTMLClasses(source: string, content: string): readonly string[]
  extractAstroClasses(source: string, content: string): readonly string[]
  createInspectionReport(input: MasterCSSDiagnosticsReportInput): MasterCSSInspectionReport
}
