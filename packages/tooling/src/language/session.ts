import type {
  MasterCSSNativeDeclarationCandidate
} from '@master/css-binding/tooling'
import { MASTER_CSS_LANGUAGE_BATCH_VERSION } from '@master/css-binding/tooling'
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

interface BindingLanguageSession {
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
  readonly binding: 'native' | 'wasm'
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
  return value as T
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
  binding: LanguageSession['binding'],
  session: BindingLanguageSession
): LanguageSession {
  const nativeSupportCache = new Map<string, boolean>()
  const collectNativeSupport = (classNames: string[]) => {
    const candidates = parse<MasterCSSNativeDeclarationCandidate[]>(
      session.nativeDeclarationCandidates(classNames)
    )
    return candidates.map((candidate) => {
      const supported = matchesLanguageServiceNativeDeclaration(candidate)
      nativeSupportCache.set(candidate.className, supported)
      return supported
    })
  }
  let completionIndexCache: MasterCSSLanguageCompletionIndex | undefined
  return {
    binding,
    analyzeDocument(request) {
      const initial = validate(parse<MasterCSSDocumentAnalysis>(session.analyzeDocument(request)))
      const classNames = initial.classPositions.map(({ token }) => token)
      if (!classNames.length) return initial
      session.classifyClassNames(classNames, collectNativeSupport(classNames))
      return validate(parse<MasterCSSDocumentAnalysis>(session.analyzeDocument(request)))
    },
    formatDirectives(request) {
      return validate(parse<MasterCSSFormatDirectivesResult>(session.formatDirectives(request)))
    },
    classifyClassNames(classNames) {
      const values = [...classNames]
      return validate(parse<MasterCSSLanguageClassifications>(
        session.classifyClassNames(values, collectNativeSupport(values))
      ))
    },
    inspectClassName(className, mode) {
      const support = collectNativeSupport([className])
      if (!support.length && nativeSupportCache.has(className)) {
        support.push(nativeSupportCache.get(className) as boolean)
      }
      return validate(parse<MasterCSSLanguageInspection>(
        session.inspectClassName(className, support, mode)
      ))
    },
    completionIndex: () => completionIndexCache ||=
      validate(parse<MasterCSSLanguageCompletionIndex>(session.completionIndex())),
    colorPresentation: (token) => validate(parse<MasterCSSLanguageColorPresentation>(session.colorPresentation(token))),
    colorTokens: (candidates) =>
      validate(parse<MasterCSSLanguageColorTokens>(session.colorTokens(candidates))),
    dispose: () => session.dispose()
  }
}
