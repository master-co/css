import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSLexerBindingSession,
  MasterCSSLintBindingSession,
  MasterCSSLanguageBindingSession,
  MasterCSSScannerBindingSession,
  MasterCSSSourceBindingSession,
  MasterCSSToolingBindingSession,
  MasterCSSToolingBindingSync,
  MasterCSSValidatorBindingSession
} from './tooling-binding-contract'
import type { MasterCSSNativeModuleOptions } from './engine-contract'
import { NativeBindingError } from './errors'
import { loadNativeBinding } from './native-loader'

export type { MasterCSSNativeModuleOptions } from './engine-contract'

export type MasterCSSNativeToolingSession = MasterCSSToolingBindingSession
export type MasterCSSNativeLexerSession = MasterCSSLexerBindingSession
export type MasterCSSNativeSourceSession = MasterCSSSourceBindingSession
export type MasterCSSNativeValidatorSession = MasterCSSValidatorBindingSession
export type MasterCSSNativeLanguageSession = MasterCSSLanguageBindingSession
export type MasterCSSNativeLintSession = MasterCSSLintBindingSession
export type MasterCSSNativeScannerSession = MasterCSSScannerBindingSession
export type MasterCSSNativeToolingBinding = Omit<MasterCSSToolingBindingSync, 'binding'>

function parse<T>(value: string): T {
  return JSON.parse(value) as T
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

function bindingError(cause: unknown): MasterCSSError {
  if (cause instanceof MasterCSSError) return cause
  const code = cause instanceof NativeBindingError ? cause.code : 'NATIVE_LOAD_FAILED'
  return new MasterCSSError({
    code,
    domain: 'binding',
    message: cause instanceof Error ? cause.message : String(cause)
  }, { cause })
}

export function loadNativeToolingBinding(
  moduleOptions: MasterCSSNativeModuleOptions = {}
): MasterCSSNativeToolingBinding | undefined {
  try {
    const loaded = loadNativeBinding(moduleOptions)
    if (!loaded) return
    const nativeBinding = loaded.binding
    const toolingBinding: MasterCSSNativeToolingBinding = {
      createLexerSession() {
        const session = new nativeBinding.LexerSession()
        const dispose = disposable(session)
        return {
          analyze: (input) => parse(session.analyze(request(input))),
          dispose,
          [Symbol.dispose]: dispose
        }
      },
      createSourceSession() {
        const session = new nativeBinding.SourceSession()
        const dispose = disposable(session)
        return {
          extract: (input) => parse(session.extract(request(input))),
          dispose,
          [Symbol.dispose]: dispose
        }
      },
      createValidatorSession(manifest) {
        const session = new nativeBinding.ValidatorSession(serializeMasterCSSManifest(manifest))
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
        const session = new nativeBinding.LanguageSession(serializeMasterCSSManifest(manifest))
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
        const session = new nativeBinding.LintSession(serializeMasterCSSManifest(manifest))
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
        const session = new nativeBinding.ScannerSession(serializeMasterCSSManifest(manifest))
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
      extractClassCandidates: (content) => nativeBinding.extractClassCandidates(content),
      extractOxcClasses: (source, content) => nativeBinding.extractOxcClasses(source, content),
      extractHTMLClasses: (source, content) => nativeBinding.extractHtmlClasses(source, content),
      extractAstroClasses: (source, content) => nativeBinding.extractAstroClasses(source, content),
      createInspectionReport: (input) =>
        parse(nativeBinding.createInspectionReportJson(request(input)))
    }
    return Object.freeze(toolingBinding)
  } catch (cause) {
    throw bindingError(cause)
  }
}

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
