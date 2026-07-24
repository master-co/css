import {
  MASTER_CSS_DIAGNOSTIC_VERSION,
  MasterCSSError,
  type MasterCSSDiagnostic,
  type MasterCSSDiagnosticDomain
} from '@master/css-schema'
import { NativeBindingError } from './errors'

interface BindingDiagnosticPayload {
  readonly code?: unknown
  readonly message?: unknown
  readonly source?: unknown
  readonly range?: {
    readonly start?: unknown
    readonly end?: unknown
  }
  readonly notes?: unknown
}

function parseBindingDiagnostic(cause: unknown): BindingDiagnosticPayload | undefined {
  if (!cause || typeof cause !== 'object') return
  const message = 'message' in cause ? cause.message : undefined
  if (typeof message !== 'string') return
  const start = message.indexOf('{')
  if (start === -1) return
  try {
    const parsed = JSON.parse(message.slice(start)) as BindingDiagnosticPayload
    return typeof parsed.message === 'string' ? parsed : undefined
  } catch {
    return
  }
}

function positionAt(source: string, offset: number) {
  const prefix = source.slice(0, Math.max(0, offset))
  const lines = prefix.split(/\r\n?|\n/)
  return Object.freeze({
    line: lines.length - 1,
    character: lines.at(-1)?.length ?? 0
  })
}

export function normalizeBindingError(
  cause: unknown,
  domain: MasterCSSDiagnosticDomain = 'binding',
  fallbackCode = 'INTERNAL',
  fallbackMessage = 'Master CSS binding operation failed.',
  sourceText?: string
): MasterCSSError {
  if (cause instanceof MasterCSSError) return cause
  const parsed = parseBindingDiagnostic(cause)
  const code = typeof parsed?.code === 'string'
    ? parsed.code
    : cause instanceof NativeBindingError
      ? cause.code
      : cause && typeof cause === 'object' && 'code' in cause && typeof cause.code === 'string'
        ? cause.code
        : fallbackCode
  const message = typeof parsed?.message === 'string'
    ? parsed.message
    : cause instanceof Error && cause.message
      ? cause.message
      : fallbackMessage
  const diagnostic: MasterCSSDiagnostic | undefined = parsed
    ? Object.freeze({
      version: MASTER_CSS_DIAGNOSTIC_VERSION,
      code,
      domain,
      severity: 'error',
      message,
      ...(typeof parsed.source === 'string' ? { source: parsed.source } : {}),
      ...(sourceText !== undefined
        && typeof parsed.range?.start === 'number'
        && typeof parsed.range.end === 'number'
        ? {
          range: Object.freeze({
            start: positionAt(sourceText, parsed.range.start),
            end: positionAt(sourceText, parsed.range.end)
          })
        }
        : {}),
      ...(Array.isArray(parsed.notes)
        ? { notes: Object.freeze(parsed.notes.filter((note): note is string => typeof note === 'string')) }
        : {})
    })
    : undefined
  return new MasterCSSError({
    code,
    domain,
    message,
    ...(diagnostic ? { diagnostics: [diagnostic] } : {})
  }, { cause })
}

export function callBinding<T>(
  domain: MasterCSSDiagnosticDomain,
  operation: () => T,
  sourceText?: string
): T {
  try {
    return operation()
  } catch (cause) {
    throw normalizeBindingError(cause, domain, 'INTERNAL', 'Master CSS binding operation failed.', sourceText)
  }
}

export async function callBindingAsync<T>(
  domain: MasterCSSDiagnosticDomain,
  operation: () => Promise<T>,
  sourceText?: string
): Promise<T> {
  try {
    return await operation()
  } catch (cause) {
    throw normalizeBindingError(cause, domain, 'INTERNAL', 'Master CSS binding operation failed.', sourceText)
  }
}
