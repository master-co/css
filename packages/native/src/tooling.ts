import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSNativeModuleOptions } from './engine-contract'
import { NativeBindingError } from './errors'
import { loadNativeBinding } from './native-loader'

export type { MasterCSSNativeModuleOptions } from './engine-contract'

export interface MasterCSSNativeToolingSession extends Disposable {
  dispose(): void
}

export interface MasterCSSNativeLexerSession extends MasterCSSNativeToolingSession {
  analyze(request: unknown): unknown
}

export interface MasterCSSNativeSourceSession extends MasterCSSNativeToolingSession {
  extract(request: unknown): unknown
}

export interface MasterCSSNativeValidatorSession extends MasterCSSNativeToolingSession {
  nativeDeclarationCandidates(classNames: readonly string[]): unknown
  generateClassRules(classNames: readonly string[], nativeSupport?: readonly boolean[]): unknown
}

export interface MasterCSSNativeLanguageSession extends MasterCSSNativeToolingSession {
  analyzeDocument(request: unknown): unknown
  formatDirectives(request: unknown): unknown
  nativeDeclarationCandidates(classNames: readonly string[]): unknown
  classifyClassNames(classNames: readonly string[], nativeSupport?: readonly boolean[]): unknown
  inspectClassName(className: string, nativeSupport?: readonly boolean[], mode?: string): unknown
  completionIndex(): unknown
  colorPresentation(colorToken: string): unknown
  colorTokens(candidates: unknown): unknown
}

export interface MasterCSSNativeLintSession extends MasterCSSNativeToolingSession {
  nativeDeclarationCandidates(classNames: readonly string[]): unknown
  resolveValidation(batch: unknown, ruleErrors: unknown): unknown
  canonicalClassNames(classNames: readonly string[], nativeSupport: readonly boolean[] | undefined, options?: unknown): unknown
  canonicalClassGroups(classNames: readonly string[], nativeSupport: readonly boolean[] | undefined, options?: unknown): unknown
  canonicalComposeDirective(classNames: readonly string[], nativeSupport: readonly boolean[] | undefined, options?: unknown): unknown
  rawValueCandidates(classNames: readonly string[], nativeSupport: readonly boolean[] | undefined, invalidGeneratedClasses: readonly string[]): unknown
  analyze(classNames: readonly string[], nativeSupport: readonly boolean[] | undefined, invalidGeneratedClasses: readonly string[]): unknown
  analyzeClassList(classList: string, classNames: readonly string[], nativeSupport: readonly boolean[] | undefined, invalidGeneratedClasses: readonly string[]): unknown
  analyzeClassListPolicy(request: unknown): unknown
}

export interface MasterCSSNativeScannerSession extends MasterCSSNativeToolingSession {
  scan(source: string, content: string): unknown
  extractCandidates(source: string, content: string): readonly string[]
  nativeDeclarationCandidates(candidates: readonly string[]): unknown
  collectCandidates(candidates: readonly string[]): readonly string[]
  filterCandidates(candidates: readonly string[], blocklist: unknown): readonly string[]
  invalidGeneratedClasses(batch: unknown, ruleSupport: readonly (readonly boolean[])[]): readonly string[]
  scanCandidates(
    source: string,
    content: string,
    candidates: readonly string[],
    blocklist: unknown,
    nativeSupport: readonly boolean[],
    invalidGeneratedClasses: readonly string[]
  ): unknown
  ensureClassRules(classNames: readonly string[]): unknown
  registerNativeClassNames(classNames: readonly string[]): boolean
  reset(): void
  snapshot(): unknown
}

export interface MasterCSSNativeToolingBackend {
  createLexerSession(): MasterCSSNativeLexerSession
  createSourceSession(): MasterCSSNativeSourceSession
  createValidatorSession(manifest: MasterCSSManifest): MasterCSSNativeValidatorSession
  createLanguageSession(manifest: MasterCSSManifest): MasterCSSNativeLanguageSession
  createLintSession(manifest: MasterCSSManifest): MasterCSSNativeLintSession
  createScannerSession(manifest: MasterCSSManifest): MasterCSSNativeScannerSession
  extractClassCandidates(content: string): readonly string[]
  extractOxcClasses(source: string, content: string): readonly string[]
  extractHTMLClasses(source: string, content: string): readonly string[]
  extractAstroClasses(source: string, content: string): readonly string[]
  createInspectionReport(input: unknown): unknown
}

function parse(value: string) {
  return JSON.parse(value) as unknown
}

function request(value: unknown) {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function disposable<T extends { dispose(): void }>(session: T) {
  let disposed = false
  return () => {
    if (disposed) return
    disposed = true
    session.dispose()
  }
}

function backendError(cause: unknown): MasterCSSError {
  if (cause instanceof MasterCSSError) return cause
  const code = cause instanceof NativeBindingError ? cause.code : 'NATIVE_LOAD_FAILED'
  return new MasterCSSError({
    code,
    domain: 'backend',
    message: cause instanceof Error ? cause.message : String(cause)
  }, { cause })
}

export function loadNativeToolingBackend(
  moduleOptions: MasterCSSNativeModuleOptions = {}
): MasterCSSNativeToolingBackend | undefined {
  try {
    const loaded = loadNativeBinding(moduleOptions)
    if (!loaded) return
    const binding = loaded.binding
    const backend: MasterCSSNativeToolingBackend = {
      createLexerSession() {
        const session = new binding.LexerSession()
        const dispose = disposable(session)
        return {
          analyze: (input) => parse(session.analyze(request(input))),
          dispose,
          [Symbol.dispose]: dispose
        }
      },
      createSourceSession() {
        const session = new binding.SourceSession()
        const dispose = disposable(session)
        return {
          extract: (input) => parse(session.extract(request(input))),
          dispose,
          [Symbol.dispose]: dispose
        }
      },
      createValidatorSession(manifest) {
        const session = new binding.ValidatorSession(serializeMasterCSSManifest(manifest))
        const dispose = disposable(session)
        return {
          nativeDeclarationCandidates: (classNames) =>
            parse(session.nativeDeclarationCandidates([...classNames])),
          generateClassRules: (classNames, nativeSupport) =>
            parse(session.generateClasses(
              [...classNames],
              nativeSupport ? [...nativeSupport] : undefined
            )),
          dispose,
          [Symbol.dispose]: dispose
        }
      },
      createLanguageSession(manifest) {
        const session = new binding.LanguageSession(serializeMasterCSSManifest(manifest))
        const dispose = disposable(session)
        return {
          analyzeDocument: (input) => parse(session.analyzeDocument(request(input))),
          formatDirectives: (input) => parse(session.formatDirectives(request(input))),
          nativeDeclarationCandidates: (classNames) =>
            parse(session.nativeDeclarationCandidates([...classNames])),
          classifyClassNames: (classNames, nativeSupport) =>
            parse(session.classifyClassNames(
              [...classNames],
              nativeSupport ? [...nativeSupport] : undefined
            )),
          inspectClassName: (className, nativeSupport, mode) =>
            parse(session.inspectClassName(
              className,
              nativeSupport ? [...nativeSupport] : undefined,
              mode
            )),
          completionIndex: () => parse(session.completionIndex()),
          colorPresentation: (colorToken) => parse(session.colorPresentation(colorToken)),
          colorTokens: (candidates) => parse(session.colorTokens(request(candidates))),
          dispose,
          [Symbol.dispose]: dispose
        }
      },
      createLintSession(manifest) {
        const session = new binding.LintSession(serializeMasterCSSManifest(manifest))
        const dispose = disposable(session)
        return {
          nativeDeclarationCandidates: (classNames) =>
            parse(session.nativeDeclarationCandidates([...classNames])),
          resolveValidation: (batch, ruleErrors) =>
            parse(session.resolveValidation(request(batch), request(ruleErrors))),
          canonicalClassNames: (classNames, nativeSupport, options) =>
            parse(session.canonicalClassNames(
              [...classNames],
              nativeSupport ? [...nativeSupport] : undefined,
              options === undefined ? undefined : request(options)
            )),
          canonicalClassGroups: (classNames, nativeSupport, options) =>
            parse(session.canonicalClassGroups(
              [...classNames],
              nativeSupport ? [...nativeSupport] : undefined,
              options === undefined ? undefined : request(options)
            )),
          canonicalComposeDirective: (classNames, nativeSupport, options) =>
            parse(session.canonicalComposeDirective(
              [...classNames],
              nativeSupport ? [...nativeSupport] : undefined,
              options === undefined ? undefined : request(options)
            )),
          rawValueCandidates: (classNames, nativeSupport, invalidGeneratedClasses) =>
            parse(session.rawValueCandidates(
              [...classNames],
              nativeSupport ? [...nativeSupport] : undefined,
              [...invalidGeneratedClasses]
            )),
          analyze: (classNames, nativeSupport, invalidGeneratedClasses) =>
            parse(session.analyze(
              [...classNames],
              nativeSupport ? [...nativeSupport] : undefined,
              [...invalidGeneratedClasses]
            )),
          analyzeClassList: (classList, classNames, nativeSupport, invalidGeneratedClasses) =>
            parse(session.analyzeClassList(
              classList,
              [...classNames],
              nativeSupport ? [...nativeSupport] : undefined,
              [...invalidGeneratedClasses]
            )),
          analyzeClassListPolicy: (input) =>
            parse(session.analyzeClassListPolicy(request(input))),
          dispose,
          [Symbol.dispose]: dispose
        }
      },
      createScannerSession(manifest) {
        const session = new binding.ScannerSession(serializeMasterCSSManifest(manifest))
        const dispose = disposable(session)
        return {
          scan: (source, content) => parse(session.scan(source, content)),
          extractCandidates: (source, content) => session.extractCandidates(source, content),
          nativeDeclarationCandidates: (candidates) =>
            parse(session.nativeDeclarationCandidates([...candidates])),
          collectCandidates: (candidates) => session.collectCandidates([...candidates]),
          filterCandidates: (candidates, blocklist) =>
            session.filterCandidates([...candidates], request(blocklist)),
          invalidGeneratedClasses: (batch, ruleSupport) =>
            session.invalidGeneratedClasses(
              request(batch),
              ruleSupport.map((values) => [...values])
            ),
          scanCandidates: (
            source,
            content,
            candidates,
            blocklist,
            nativeSupport,
            invalidGeneratedClasses
          ) => parse(session.scanCandidates(
            source,
            content,
            [...candidates],
            request(blocklist),
            [...nativeSupport],
            [...invalidGeneratedClasses]
          )),
          ensureClassRules: (classNames) => parse(session.ensureClasses([...classNames])),
          registerNativeClassNames: (classNames) =>
            session.registerNativeClasses([...classNames]),
          reset: () => session.reset(),
          snapshot: () => parse(session.state()),
          dispose,
          [Symbol.dispose]: dispose
        }
      },
      extractClassCandidates: (content) => binding.extractClassCandidates(content),
      extractOxcClasses: (source, content) => binding.extractOxcClasses(source, content),
      extractHTMLClasses: (source, content) => binding.extractHtmlClasses(source, content),
      extractAstroClasses: (source, content) => binding.extractAstroClasses(source, content),
      createInspectionReport: (input) =>
        parse(binding.createInspectionReportJson(request(input)))
    }
    return Object.freeze(backend)
  } catch (cause) {
    throw backendError(cause)
  }
}

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
