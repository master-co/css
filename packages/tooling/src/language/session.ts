import type {
  MasterCSSNativeDeclarationCandidate
} from '@master/css-binding/tooling'
import { MASTER_CSS_LANGUAGE_BATCH_VERSION } from '@master/css-binding/tooling'
import { MasterCSSError } from '@master/css-schema'
import { freezeToolingResult } from '../immutable'
import { withCSSValueValidation } from '../value-validation'
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
  prepareDocument(request: unknown): { readonly id: number, readonly nativeCandidates: readonly MasterCSSNativeDeclarationCandidate[] }
  finishDocument(id: number, nativeSupport: boolean[]): unknown
  cancelDocument(id: number): void
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

export interface LanguageSession extends Disposable {
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
  return freezeToolingResult(value)
}

export function bindLanguageSession(
  binding: LanguageSession['binding'],
  session: BindingLanguageSession
): LanguageSession {
  let disposed = false
  const assertActive = () => {
    if (disposed) throw new MasterCSSError({
      code: 'SESSION_DISPOSED',
      domain: 'tooling',
      message: 'The Master CSS language session has been disposed.'
    })
  }
  const dispose = () => {
    if (disposed) return
    disposed = true
    completionIndexCache = undefined
    session.dispose()
  }
  let completionIndexCache: MasterCSSLanguageCompletionIndex | undefined
  return {
    binding,
    analyzeDocument(request) {
      assertActive()
      const prepared = session.prepareDocument(request)
      try {
        return validate(parse<MasterCSSDocumentAnalysis>(session.finishDocument(prepared.id, [])))
      } finally {
        session.cancelDocument(prepared.id)
      }
    },
    formatDirectives(request) {
      assertActive()
      return validate(parse<MasterCSSFormatDirectivesResult>(session.formatDirectives(request)))
    },
    classifyClassNames(classNames) {
      assertActive()
      const values = [...classNames]
      return validate(parse<MasterCSSLanguageClassifications>(
        session.classifyClassNames(values)
      ))
    },
    inspectClassName(className, mode) {
      assertActive()
      return validate(withCSSValueValidation(parse<MasterCSSLanguageInspection>(
        session.inspectClassName(className, undefined, mode)
      )))
    },
    completionIndex() {
      assertActive()
      return completionIndexCache ||= validate(parse<MasterCSSLanguageCompletionIndex>(session.completionIndex()))
    },
    colorPresentation(token) {
      assertActive()
      return validate(parse<MasterCSSLanguageColorPresentation>(session.colorPresentation(token)))
    },
    colorTokens(candidates) {
      assertActive()
      return validate(parse<MasterCSSLanguageColorTokens>(session.colorTokens(candidates)))
    },
    dispose,
    [Symbol.dispose]: dispose
  }
}
