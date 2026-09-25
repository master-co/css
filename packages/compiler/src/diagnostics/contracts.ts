import type { MasterCSSClassValidation } from '@master/css-tooling/validator'
import type { MasterCSSDiagnostic } from '@master/css-binding/tooling'

export type MasterCSSInspectionDiagnosticSeverity = 'error' | 'warning' | 'info'
export type MasterCSSInspectionDiagnosticCode =
  | 'invalid-scanner-class'
  | 'missing-css'
  | 'stylesheet-error'
  | 'stylesheet-warning'
  | 'scanner-error'
  | MasterCSSDiagnostic['code']
export type MasterCSSInspectionDiagnosticSourceKind =
  | 'scanner'
  | 'stylesheet'
  | 'missing-css'
export type MasterCSSMissingCSSStatus = 'present' | 'missing'
export type MasterCSSMissingCSSReason =
  | 'generated'
  | 'native-css'
  | 'safelist'
  | 'invalid'
  | 'blocklisted'
  | 'not-detected'

export interface MasterCSSMissingCSSResult {
  readonly className: string
  readonly status: MasterCSSMissingCSSStatus
  readonly reason: MasterCSSMissingCSSReason
}

export interface MasterCSSInspectionDiagnostic {
  readonly code: MasterCSSInspectionDiagnosticCode
  readonly phase: MasterCSSDiagnostic['phase']
  readonly range?: MasterCSSDiagnostic['range']
  readonly notes?: readonly string[]
  readonly severity: MasterCSSInspectionDiagnosticSeverity
  readonly message: string
  readonly source: 'Master CSS'
  readonly sourceKind: MasterCSSInspectionDiagnosticSourceKind
  readonly filePath?: string
  readonly data?: Readonly<
    | { cwd: string }
    | { className: string }
    | MasterCSSMissingCSSResult
  >
}

export interface MasterCSSDiscoveredClasses {
  readonly latent: readonly string[]
  readonly valid: readonly string[]
  readonly invalid: readonly string[]
  readonly usedNative: readonly string[]
}

export interface MasterCSSSourceInspection {
  readonly filePath: string
  readonly source: string
  readonly scanned: boolean
  readonly changed: boolean
  readonly discovered: MasterCSSDiscoveredClasses
}

export interface MasterCSSStylesheetInspection {
  compositions?: import('@master/css-schema/css-directives').CSSCompositionTrace[]
  readonly filePath: string
  readonly masterCSS: boolean
  readonly pruneNativeCSS: boolean
  readonly dependencies: readonly string[]
  readonly sourceDependencies: readonly string[]
  readonly warnings: readonly string[]
  readonly errors: readonly string[]
}

export interface MasterCSSStylesheetError {
  readonly filePath: string
  readonly message: string
}

export interface MasterCSSInspectionReport {
  readonly version: 3
  readonly cwd: string
  readonly inputs: Readonly<{
    patterns: readonly string[]
    files: readonly string[]
    classes: readonly string[]
  }>
  readonly scanner: Readonly<{
    counts: Readonly<{
      latent: number
      valid: number
      invalid: number
      native: number
      usedNative: number
      safelist: number
      blocklist: number
    }>
    classes: Readonly<{
      latent: readonly string[]
      valid: readonly string[]
      invalid: readonly string[]
      native: readonly string[]
      usedNative: readonly string[]
      safelist: readonly string[]
      blocklist: readonly string[]
    }>
    resetDependencies: readonly string[]
  }>
  readonly stylesheets: Readonly<{
    entries: readonly MasterCSSStylesheetInspection[]
    dependencies: readonly string[]
    warnings: readonly string[]
    errors: readonly MasterCSSStylesheetError[]
  }>
  readonly css: Readonly<{
    bytes: number
    included: boolean
    text?: string
    emittedGlobals: Readonly<{
      variables: number
      animations: number
    }>
  }>
  readonly missingCSS: Readonly<{
    checked: readonly string[]
    present: readonly MasterCSSMissingCSSResult[]
    missing: readonly MasterCSSMissingCSSResult[]
  }>
  readonly files: readonly MasterCSSSourceInspection[]
  readonly inspections: readonly MasterCSSClassValidation[]
  readonly diagnostics: readonly MasterCSSInspectionDiagnostic[]
  readonly summary: Readonly<{
    files: number
    stylesheets: number
    diagnostics: number
    errors: number
    warnings: number
    missingCSS: number
    invalidClasses: number
  }>
}
