import {
  type CanonicalClassNameOptions,
  type RawValuePolicyOptions
} from './contracts'

export interface MasterCSSClassListEditOptions {
  unescape?: string | false
}

export type MasterCSSLintRuleId =
  | 'sort-classes'
  | 'no-invalid-classes'
  | 'no-conflicting-classes'
  | 'prefer-canonical-classes'
  | 'no-unapproved-raw-values'

export type MasterCSSLintDiagnosticSeverity = 'error' | 'warning'
export interface MasterCSSLintRange { start: number, end: number }
export interface MasterCSSLintFix {
  range: MasterCSSLintRange
  text: string
  scope?: 'class-list' | 'directive'
}
export type MasterCSSLintDiagnosticData = Record<string, string | number | boolean | string[] | null | undefined>
export interface MasterCSSLintDiagnostic {
  ruleId: MasterCSSLintRuleId
  code: string
  message: string
  severity: MasterCSSLintDiagnosticSeverity
  range: MasterCSSLintRange
  data?: MasterCSSLintDiagnosticData
  fix?: MasterCSSLintFix
}
export interface MasterCSSLintReport { diagnostics: MasterCSSLintDiagnostic[] }
export interface MasterCSSLintReportOptions extends MasterCSSClassListEditOptions {
  severity?: MasterCSSLintDiagnosticSeverity
}
export interface MasterCSSInvalidClassesReportOptions extends MasterCSSLintReportOptions {
  disallowUnknownClass?: boolean
}
export interface MasterCSSCanonicalClassesReportOptions extends MasterCSSLintReportOptions, CanonicalClassNameOptions { }
export interface MasterCSSUnapprovedRawValueClassesReportOptions extends MasterCSSLintReportOptions, RawValuePolicyOptions { }
export interface MasterCSSClassListLintReportOptions extends MasterCSSInvalidClassesReportOptions, RawValuePolicyOptions, CanonicalClassNameOptions {
  rules?: Partial<Record<MasterCSSLintRuleId, boolean>>
  severities?: Partial<Record<MasterCSSLintRuleId, MasterCSSLintDiagnosticSeverity>>
}
