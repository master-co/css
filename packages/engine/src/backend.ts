import type {
  MasterCSSBackend,
  MasterCSSDiagnostic,
  MasterCSSEngineInspectionIR,
  MasterCSSEngineSnapshotIR,
  MasterCSSEngineTransitionIR,
  MasterCSSResolvedBackend,
  MasterCSSErrorCode,
  MasterCSSSourceRange
} from '@master/css-schema'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

export interface MasterCSSEngineOptions {
  manifest: MasterCSSManifest
  emittedGlobals?: MasterCSSEmittedGlobals
  backend?: MasterCSSBackend
}

export interface MasterCSSEngine {
  readonly backend: MasterCSSResolvedBackend
  readonly text: string
  ensureClassRules(classNames: readonly string[]): MasterCSSEngineTransitionIR
  deleteClassRules(classNames: readonly string[]): MasterCSSEngineTransitionIR
  refresh(manifest: MasterCSSManifest): MasterCSSEngineTransitionIR
  inspect(className: string): MasterCSSEngineInspectionIR
  snapshot(): MasterCSSEngineSnapshotIR
  dispose(): void
}

export interface BackendEngineSession {
  ensureClassRules(classNames: string[]): MasterCSSEngineTransitionIR | string
  deleteClassRules(classNames: string[]): MasterCSSEngineTransitionIR | string
  refresh(manifestJSON: string): MasterCSSEngineTransitionIR | string
  inspect(className: string): MasterCSSEngineInspectionIR | string
  snapshot(): MasterCSSEngineSnapshotIR | string
  dispose(): void
}

export type MasterCSSEngineErrorCode = MasterCSSErrorCode

interface MasterCSSEngineErrorOptions extends ErrorOptions {
  source?: string
  range?: MasterCSSSourceRange
  notes?: string[]
}

export class MasterCSSEngineError extends Error implements MasterCSSDiagnostic {
  readonly source?: string
  readonly range?: MasterCSSSourceRange
  readonly notes?: string[]

  constructor(
    public readonly code: MasterCSSEngineErrorCode,
    message: string,
    options: MasterCSSEngineErrorOptions = {}
  ) {
    super(message, options)
    this.name = 'MasterCSSEngineError'
    this.source = options.source
    this.range = options.range
    this.notes = options.notes
  }

  toDiagnostic(): MasterCSSDiagnostic {
    return {
      code: this.code,
      message: this.message,
      ...(this.source ? { source: this.source } : {}),
      ...(this.range ? { range: this.range } : {}),
      ...(this.notes?.length ? { notes: this.notes } : {})
    }
  }
}

const errorCodes = new Set<MasterCSSErrorCode>([
  'INVALID_MANIFEST',
  'UNSUPPORTED_MANIFEST_VERSION',
  'INVALID_HYDRATION_MANIFEST',
  'NATIVE_UNAVAILABLE',
  'NATIVE_LOAD_FAILED',
  'WASM_LOAD_FAILED',
  'RUNTIME_STARTUP_TIMEOUT',
  'CSS_PARSE_ERROR',
  'CSS_PRINT_ERROR',
  'CSS_DIRECTIVE_ERROR',
  'CSS_IMPORT_ERROR',
  'SESSION_DISPOSED',
  'INVALID_INPUT',
  'INTERNAL'
])

function parseDiagnostic(message: string): MasterCSSDiagnostic | undefined {
  const start = message.indexOf('{')
  if (start === -1) return
  try {
    const value = JSON.parse(message.slice(start)) as Partial<MasterCSSDiagnostic>
    if (!value.code || !errorCodes.has(value.code) || typeof value.message !== 'string') return
    return value as MasterCSSDiagnostic
  } catch {
    return
  }
}

export function normalizeEngineError(
  cause: unknown,
  fallbackCode: MasterCSSEngineErrorCode = 'INTERNAL',
  fallbackMessage = 'Master CSS engine operation failed.'
): MasterCSSEngineError {
  if (cause instanceof MasterCSSEngineError) return cause
  const message = cause instanceof Error ? cause.message : String(cause || fallbackMessage)
  const diagnostic = parseDiagnostic(message)
  if (diagnostic) {
    return new MasterCSSEngineError(diagnostic.code, diagnostic.message, {
      cause,
      source: diagnostic.source,
      range: diagnostic.range,
      notes: diagnostic.notes
    })
  }
  return new MasterCSSEngineError(fallbackCode, fallbackMessage, { cause })
}
