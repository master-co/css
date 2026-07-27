import type {
  MasterCSSNativeDeclarationCandidate
} from '@master/css-binding/tooling'
import { MASTER_CSS_LANGUAGE_BATCH_VERSION } from '@master/css-binding/tooling'
import { MasterCSSError } from '@master/css-schema'
import { matchesLanguageServiceNativeDeclaration } from './master-css'
import {
  getMdnPropertyValueNames,
  getMdnPseudoClassNames,
  getMdnPseudoElementNames
} from './utils/mdn-css-data'
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

function augmentCompletionIndex(
  index: MasterCSSLanguageCompletionIndex
): MasterCSSLanguageCompletionIndex {
  const classEntries = index.classEntries.map((entry) => ({ ...entry }))
  const labels = new Set(classEntries.map(({ label }) => label))
  const addValue = (
    label: string,
    detail?: string,
    sortText?: string
  ) => {
    if (labels.has(label)) return
    labels.add(label)
    classEntries.push({
      label,
      kind: 'value',
      detail,
      sortText,
      triggerSuggest: false
    })
  }

  for (const label of [...getMdnPseudoClassNames(), ...getMdnPseudoElementNames()]) {
    addValue(label)
  }

  const properties = classEntries
    .filter(({ kind, label }) => kind === 'property' && label.endsWith(':'))
    .map((entry) => ({
      key: entry.label.slice(0, -1),
      property: entry.detail && entry.detail !== 'ambiguous key'
        ? entry.detail
        : entry.label.slice(0, -1)
    }))
  properties.push(
    { key: 'display', property: 'display' },
    { key: 'font-style', property: 'font-style' },
    { key: 'line-clamp', property: 'line-clamp' },
    { key: 'text-align', property: 'text-align' },
    { key: 'user-select', property: 'user-select' },
    { key: '-webkit-text-size-adjust', property: 'text-size-adjust' },
    { key: '-moz-text-size-adjust', property: 'text-size-adjust' },
    { key: '-ms-text-size-adjust', property: 'text-size-adjust' }
  )
  for (const { key, property } of properties) {
    for (const value of getMdnPropertyValueNames(property)) {
      if (value.includes(' ')) continue
      addValue(`${key}:${value}`, `${property}: ${value}`, `ccccc${value}`)
    }
  }

  return { ...index, classEntries }
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
    completionIndex: () => completionIndexCache ||= augmentCompletionIndex(
      validate(parse<MasterCSSLanguageCompletionIndex>(session.completionIndex()))
    ),
    colorPresentation: (token) => validate(parse<MasterCSSLanguageColorPresentation>(session.colorPresentation(token))),
    colorTokens: (candidates) =>
      validate(parse<MasterCSSLanguageColorTokens>(session.colorTokens(candidates))),
    dispose: () => session.dispose()
  }
}
