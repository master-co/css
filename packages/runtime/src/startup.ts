import {
  MASTER_CSS_DIAGNOSTIC_VERSION,
  MasterCSSError,
  type MasterCSSDiagnostic
} from '@master/css-schema'

export const MASTER_CSS_RUNTIME_STARTUP_TIMEOUT_MS = 3000

/** Races startup steps against one deadline; `subject` names what failed to start. */
export function createStartupTimeout(
  view: Pick<typeof globalThis, 'setTimeout' | 'clearTimeout'>,
  timeoutMs: number,
  subject: 'runtime' | 'engine'
) {
  let handle: ReturnType<typeof globalThis.setTimeout> | undefined
  const expired = new Promise<never>((_, reject) => {
    handle = view.setTimeout(() => reject(new MasterCSSError({
      code: 'RUNTIME_STARTUP_TIMEOUT',
      domain: 'runtime',
      message: `Master CSS ${subject} did not start within ${timeoutMs}ms.`
    })), timeoutMs)
  })
  return {
    race: <T>(step: Promise<T>) => Promise.race([step, expired]),
    clear: () => view.clearTimeout(handle)
  }
}

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
