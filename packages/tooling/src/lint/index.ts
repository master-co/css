import type { MasterCSSBackend } from '@master/css-backend'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSession } from '../tooling-session'
import type {
  MasterCSSLintAnalysis,
  MasterCSSLintBackendDiagnostic
} from './analysis'
import type {
  MasterCSSLintDiagnostic,
  MasterCSSLintDiagnosticSeverity
} from './diagnostics'

export { defaultClassLintSettings } from './constants'
export {
  defaultMasterCSSLintRules,
  fixMasterCSSContent,
  lintMasterCSSContent,
  masterCSSLintRuleIds,
  resolveMasterCSSLintRules,
  summarizeMasterCSSLintFiles
} from './source'
export type {
  MasterCSSCanonicalClassesReportOptions,
  MasterCSSClassListEditOptions,
  MasterCSSClassListLintReportOptions,
  MasterCSSInvalidClassesReportOptions,
  MasterCSSLintDiagnostic,
  MasterCSSLintDiagnosticData,
  MasterCSSLintDiagnosticSeverity,
  MasterCSSLintFix,
  MasterCSSLintRange,
  MasterCSSLintReport,
  MasterCSSLintReportOptions,
  MasterCSSLintRuleId,
  MasterCSSUnapprovedRawValueClassesReportOptions
} from './diagnostics'
export type {
  MasterCSSLintAnalysis,
  MasterCSSLintBackendDiagnostic,
  MasterCSSLintCanonicalClassGroupSuggestion,
  MasterCSSLintCanonicalClassSuggestion,
  MasterCSSLintClassConflict,
  MasterCSSLintClassListAnalysis,
  MasterCSSLintClassListOptions,
  MasterCSSLintDocumentAnalysis,
  MasterCSSLintEdit,
  MasterCSSLintPartialClassConflict,
  MasterCSSLintRawValueCandidate,
  MasterCSSLintSessionContract,
  MasterCSSLintToken
} from './analysis'
export {
  defaultCanonicalClassNameOptions
} from './contracts'
export type {
  CanonicalClassNameOptions,
  CanonicalComposeDirectiveResult,
  CanonicalComposeDirectiveSuggestion,
  RawValuePolicyOptions
} from './contracts'
export type {
  MasterCSSFixContentOptions,
  MasterCSSLintContentOptions,
  MasterCSSLintContentRuleOptions,
  MasterCSSLintDiagnosticSourceKind,
  MasterCSSLintFileResult,
  MasterCSSLintFileSourceKind,
  MasterCSSLintSourceDiagnostic,
  MasterCSSLintSourceFix,
  MasterCSSLintSourceFixKind,
  MasterCSSLintSourceFixSafety,
  MasterCSSLintSourceLocation,
  MasterCSSLintSourceLocationRange,
  MasterCSSLintSummary
} from './source'

export async function lintClassNames(
  classNames: readonly string[],
  options: {
    readonly manifest: MasterCSSManifest
    readonly backend?: MasterCSSBackend
  }
): Promise<MasterCSSLintAnalysis> {
  const session = await createToolingSession(options)
  try {
    return session.lintClassNames(classNames)
  } finally {
    session.dispose()
  }
}

export function createMasterCSSLintDiagnostics(
  diagnostics: readonly MasterCSSLintBackendDiagnostic[],
  severity: MasterCSSLintDiagnosticSeverity = 'warning'
): readonly MasterCSSLintDiagnostic[] {
  return Object.freeze(diagnostics.map((diagnostic) => Object.freeze({
    ...diagnostic,
    severity,
    fix: diagnostic.fix
  })))
}
