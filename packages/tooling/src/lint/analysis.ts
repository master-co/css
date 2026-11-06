import type {
  RawValuePolicyOptions,
  RemoteStylingPolicyOptions,
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
  readonly conflict: string
}

export interface MasterCSSLintAnalysis {
  readonly version: 4
  readonly sortedClassNames: readonly string[]
  readonly conflicts: readonly MasterCSSLintClassConflict[]
  readonly partialConflicts: readonly MasterCSSLintPartialClassConflict[]
}

export interface MasterCSSLintClassListOptions {
  readonly disallowUnknownClass?: boolean
  readonly rawValuePolicy?: RawValuePolicyOptions
  readonly remoteStylingPolicy?: RemoteStylingPolicyOptions
  readonly canonicalOptions?: CanonicalClassNameOptions
  /** Classes the same element always receives from its other class lists. */
  readonly elementClassNames?: readonly string[]
  /** Whether this class list only applies under a condition of a class binding. */
  readonly conditional?: boolean
  /** Report pre-2.0 `property:value` classes with their 2.0 spelling. */
  readonly legacyClasses?: boolean
}

export interface MasterCSSLintEdit {
  readonly range: Readonly<{ start: number, end: number }>
  readonly text: string
  readonly scope: 'class-list'
}

export interface MasterCSSLintDiagnosticInput {
  readonly ruleId: MasterCSSLintRuleId
  readonly code: string
  readonly message: string
  readonly range: Readonly<{ start: number, end: number }>
  readonly data?: MasterCSSLintDiagnosticData
  readonly fix?: MasterCSSLintEdit
}

export interface MasterCSSLintClassListAnalysis {
  readonly version: 4
  readonly analysis: MasterCSSLintAnalysis
  readonly diagnostics: readonly MasterCSSLintDiagnosticInput[]
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
  readonly diagnostics: readonly import('@master/css-binding/tooling').MasterCSSDiagnostic[]
  readonly classPositions: readonly Readonly<{
    range: Readonly<{ start: number, end: number }>
    contextRange: Readonly<{ start: number, end: number }>
    raw: string
    token: string
  }>[]
  /** Absent from bindings built before element class list groups. */
  readonly classListGroups?: readonly Readonly<{
    lists: readonly Readonly<{
      range: Readonly<{ start: number, end: number }>
      conditional: boolean
    }>[]
  }>[]
}

export interface MasterCSSLintToken {
  readonly range: Readonly<{ start: number, end: number }>
  readonly raw: string
  readonly token: string
}
