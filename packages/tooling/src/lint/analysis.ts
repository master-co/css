import type {
  CanonicalComposeDirectiveResult,
  RawValuePolicyOptions,
  CanonicalClassNameOptions
} from './contracts'
import type {
  MasterCSSLintDiagnosticData,
  MasterCSSLintRuleId
} from './diagnostics'

export interface MasterCSSLintClassConflict {
  readonly className: string
  readonly conflicts: readonly string[]
}

export interface MasterCSSLintPartialClassConflict {
  readonly className: string
  readonly replacement: string
  readonly conflict: string
}

export interface MasterCSSLintAnalysis {
  readonly version: 1
  readonly sortedClassNames: readonly string[]
  readonly conflicts: readonly MasterCSSLintClassConflict[]
  readonly partialConflicts: readonly MasterCSSLintPartialClassConflict[]
}

export interface MasterCSSLintClassListOptions {
  readonly disallowUnknownClass?: boolean
  readonly rawValuePolicy?: RawValuePolicyOptions
  readonly canonicalOptions?: CanonicalClassNameOptions
  readonly composeDirective?: boolean
}

export interface MasterCSSLintEdit {
  readonly range: Readonly<{ start: number, end: number }>
  readonly text: string
  readonly scope: 'class-list' | 'directive'
}

export interface MasterCSSLintBackendDiagnostic {
  readonly ruleId: MasterCSSLintRuleId
  readonly code: string
  readonly message: string
  readonly range: Readonly<{ start: number, end: number }>
  readonly data?: MasterCSSLintDiagnosticData
  readonly fix?: MasterCSSLintEdit
}

export interface MasterCSSLintClassListAnalysis {
  readonly version: 1
  readonly analysis: MasterCSSLintAnalysis
  readonly diagnostics: readonly MasterCSSLintBackendDiagnostic[]
  readonly sortEdit?: MasterCSSLintEdit
  readonly conflictEdit?: MasterCSSLintEdit
  readonly conflictRange?: Readonly<{ start: number, end: number }>
}

export interface MasterCSSLintCanonicalClassSuggestion {
  readonly className: string
  readonly recommended: string
}

export interface MasterCSSLintCanonicalClassGroupSuggestion {
  readonly classNames: readonly string[]
  readonly recommended: string
}

export interface MasterCSSLintRawValueCandidate {
  readonly className: string
  readonly key: string
  readonly segments: readonly string[]
  readonly properties: readonly string[]
}

export interface MasterCSSLintDocumentAnalysis {
  readonly classPositions: readonly Readonly<{
    range: Readonly<{ start: number, end: number }>
    contextRange: Readonly<{ start: number, end: number }>
    raw: string
    token: string
  }>[]
}

export interface MasterCSSLintToken {
  readonly range: Readonly<{ start: number, end: number }>
  readonly raw: string
  readonly token: string
}

export interface MasterCSSLintSessionContract {
  tokenizeClassList(classList: string, unescape?: string | false): readonly MasterCSSLintToken[]
  analyzeDocument(source: string, languageId: string): MasterCSSLintDocumentAnalysis
  analyze(classNames: readonly string[]): MasterCSSLintAnalysis
  canonicalClassGroups(
    classNames: readonly string[],
    options?: CanonicalClassNameOptions
  ): readonly MasterCSSLintCanonicalClassGroupSuggestion[]
  canonicalClassNames(
    classNames: readonly string[],
    options?: CanonicalClassNameOptions
  ): readonly MasterCSSLintCanonicalClassSuggestion[]
  canonicalComposeDirective(
    classNames: readonly string[],
    options?: CanonicalClassNameOptions
  ): CanonicalComposeDirectiveResult | undefined
  rawValueCandidates(classNames: readonly string[]): readonly MasterCSSLintRawValueCandidate[]
  analyzeClassList(
    classList: string,
    classNames: readonly string[],
    options?: MasterCSSLintClassListOptions
  ): MasterCSSLintClassListAnalysis
}
