export const MASTER_CSS_DIAGNOSTIC_VERSION = 1 as const

export type MasterCSSDiagnosticDomain =
  | 'backend'
  | 'compiler'
  | 'engine'
  | 'integration'
  | 'language'
  | 'project'
  | 'runtime'
  | 'server'
  | 'tooling'

export type MasterCSSDiagnosticSeverity = 'error' | 'warning' | 'information'

export interface MasterCSSDiagnosticPosition {
  line: number
  character: number
}

export interface MasterCSSDiagnosticRange {
  start: MasterCSSDiagnosticPosition
  end: MasterCSSDiagnosticPosition
}

export interface MasterCSSDiagnostic {
  readonly version: typeof MASTER_CSS_DIAGNOSTIC_VERSION
  readonly code: string
  readonly domain: MasterCSSDiagnosticDomain
  readonly severity: MasterCSSDiagnosticSeverity
  readonly message: string
  readonly source?: string
  readonly range?: MasterCSSDiagnosticRange
  readonly notes?: readonly string[]
  readonly help?: string
}

export interface MasterCSSErrorPayload {
  readonly code: string
  readonly domain: MasterCSSDiagnosticDomain
  readonly message: string
  readonly diagnostics?: readonly MasterCSSDiagnostic[]
}

export interface MasterCSSErrorOptions extends ErrorOptions {
  diagnostics?: readonly MasterCSSDiagnostic[]
}

export class MasterCSSError extends Error {
  readonly code: string
  readonly domain: MasterCSSDiagnosticDomain
  readonly diagnostics: readonly MasterCSSDiagnostic[]

  constructor(payload: MasterCSSErrorPayload, options: MasterCSSErrorOptions = {}) {
    super(payload.message, options)
    this.name = 'MasterCSSError'
    this.code = payload.code
    this.domain = payload.domain
    this.diagnostics = Object.freeze([...(options.diagnostics ?? payload.diagnostics ?? [])])
  }

  toJSON(): MasterCSSErrorPayload {
    return {
      code: this.code,
      domain: this.domain,
      message: this.message,
      ...(this.diagnostics.length ? { diagnostics: this.diagnostics } : {})
    }
  }
}
