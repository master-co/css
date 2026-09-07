import {
  MASTER_CSS_DIAGNOSTIC_VERSION,
  MasterCSSError,
  type MasterCSSDiagnostic
} from '@master/css-schema'

export const MASTER_CSS_RUNTIME_STARTUP_TIMEOUT_MS = 3000

export function toStartupDiagnostic(error: unknown): MasterCSSDiagnostic {
  if (error instanceof MasterCSSError && error.diagnostics[0]) return error.diagnostics[0]
  return Object.freeze({
    version: MASTER_CSS_DIAGNOSTIC_VERSION,
    code: 'INTERNAL',
    domain: 'runtime',
    severity: 'error',
    message: error instanceof Error ? error.message : String(error)
  })
}
