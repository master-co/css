import type {
  MasterCSSNativeDeclarationCandidateIR
} from '@master/css-backend/tooling'
import { MASTER_CSS_LANGUAGE_BATCH_VERSION } from '@master/css-backend/tooling'
import { MasterCSSError } from '@master/css-schema'
import { matchesLanguageServiceNativeDeclaration } from './master-css'
import type {
  MasterCSSDocumentAnalysis,
  MasterCSSDocumentAnalysisRequest,
  MasterCSSFormatDirectivesRequest,
  MasterCSSFormatDirectivesResult,
  MasterCSSLanguageClassifications,
  MasterCSSLanguageColorCandidate,
  MasterCSSLanguageColorPresentation,
  MasterCSSLanguageColorTokens,
  MasterCSSLanguageCompletionIndex,
  MasterCSSLanguageInspection
} from './contracts'

interface BackendLanguageSession {
  analyzeDocument(request: unknown): unknown
  formatDirectives(request: unknown): unknown
  nativeDeclarationCandidates(classNames: string[]): unknown
  classifyClassNames(classNames: string[], nativeSupport?: boolean[]): unknown
  inspectClassName(className: string, nativeSupport?: boolean[], mode?: string): unknown
  completionIndex(): unknown
  colorPresentation(colorToken: string): unknown
  colorTokens(candidates: unknown): unknown
  dispose(): void
}

export interface LanguageSession {
  readonly backend: 'native' | 'wasm'
  analyzeDocument(request: MasterCSSDocumentAnalysisRequest): MasterCSSDocumentAnalysis
  formatDirectives(request: MasterCSSFormatDirectivesRequest): MasterCSSFormatDirectivesResult
  classifyClassNames(classNames: readonly string[]): MasterCSSLanguageClassifications
  inspectClassName(className: string, mode?: string): MasterCSSLanguageInspection
  completionIndex(): MasterCSSLanguageCompletionIndex
  colorPresentation(colorToken: string): MasterCSSLanguageColorPresentation
  colorTokens(candidates: readonly MasterCSSLanguageColorCandidate[]): MasterCSSLanguageColorTokens
  dispose(): void
}

function parse<T>(value: unknown): T {
  return typeof value === 'string' ? JSON.parse(value) as T : value as T
}

function validate<T extends { version: number }>(value: T): T {
  if (value.version !== MASTER_CSS_LANGUAGE_BATCH_VERSION) {
    throw new MasterCSSError({
      code: 'LANGUAGE_BATCH_VERSION_MISMATCH',
      domain: 'tooling',
      message: `Expected Master CSS language batch version ${MASTER_CSS_LANGUAGE_BATCH_VERSION}, received ${String(value.version)}.`
    })
  }
  return value
}

export function bindLanguageSession(
  backend: LanguageSession['backend'],
  session: BackendLanguageSession
): LanguageSession {
  const nativeSupport = (classNames: string[]) => parse<MasterCSSNativeDeclarationCandidateIR[]>(
    session.nativeDeclarationCandidates(classNames)
  ).map(matchesLanguageServiceNativeDeclaration)
  return {
    backend,
    analyzeDocument(request) {
      return validate(parse<MasterCSSDocumentAnalysis>(session.analyzeDocument(
        backend === 'native' ? JSON.stringify(request) : request
      )))
    },
    formatDirectives(request) {
      return validate(parse<MasterCSSFormatDirectivesResult>(session.formatDirectives(
        backend === 'native' ? JSON.stringify(request) : request
      )))
    },
    classifyClassNames(classNames) {
      const values = [...classNames]
      return validate(parse<MasterCSSLanguageClassifications>(
        session.classifyClassNames(values, nativeSupport(values))
      ))
    },
    inspectClassName(className, mode) {
      return validate(parse<MasterCSSLanguageInspection>(
        session.inspectClassName(className, nativeSupport([className]), mode)
      ))
    },
    completionIndex: () => validate(parse<MasterCSSLanguageCompletionIndex>(session.completionIndex())),
    colorPresentation: (token) => validate(parse<MasterCSSLanguageColorPresentation>(session.colorPresentation(token))),
    colorTokens: (candidates) => validate(parse<MasterCSSLanguageColorTokens>(session.colorTokens(
      backend === 'native' ? JSON.stringify(candidates) : candidates
    ))),
    dispose: () => session.dispose()
  }
}
