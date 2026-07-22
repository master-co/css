import { loadNativeBinding } from '@master/css-native'
import { MASTER_CSS_LEXER_BATCH_VERSION } from '@master/css-schema'
import type {
  MasterCSSLexerBatchIR,
  MasterCSSLexerBatchRequestIR,
  MasterCSSLexerClassListInputIR,
  MasterCSSLexerClassListItemIR,
  MasterCSSLexerCSSAnalysisIR
} from '@master/css-schema/rust-contract'

export type LexerClassListInputIR = MasterCSSLexerClassListInputIR
export type LexerBatchRequest = MasterCSSLexerBatchRequestIR
export type LexerClassListItemIR = MasterCSSLexerClassListItemIR
export type LexerCssAnalysisIR = MasterCSSLexerCSSAnalysisIR
export type LexerBatchIR = MasterCSSLexerBatchIR

interface BackendLexerSession {
  analyze(request: unknown): unknown
  dispose(): void
}

export interface LexerSession {
  readonly backend: 'native' | 'wasm'
  analyze(request: LexerBatchRequest): LexerBatchIR
  dispose(): void
}

export class LexerSessionError extends Error {
  constructor(
    public readonly code: 'NATIVE_UNAVAILABLE' | 'LEXER_BATCH_VERSION_MISMATCH',
    message: string
  ) {
    super(message)
    this.name = 'LexerSessionError'
  }
}

function parse(value: unknown): LexerBatchIR {
  const result = typeof value === 'string' ? JSON.parse(value) as LexerBatchIR : value as LexerBatchIR
  if (result.version !== MASTER_CSS_LEXER_BATCH_VERSION) {
    throw new LexerSessionError(
      'LEXER_BATCH_VERSION_MISMATCH',
      `Expected Master CSS lexer batch version ${MASTER_CSS_LEXER_BATCH_VERSION}, received ${String(result.version)}.`
    )
  }
  return result
}

export function bindLexerSession(
  backend: LexerSession['backend'],
  session: BackendLexerSession
): LexerSession {
  return {
    backend,
    analyze(request) {
      return parse(session.analyze(backend === 'native' ? JSON.stringify(request) : request))
    },
    dispose: () => session.dispose()
  }
}

export function createNativeLexerSession(options: { required?: boolean } = {}) {
  const loaded = loadNativeBinding({ required: options.required })
  if (!loaded) return
  return bindLexerSession('native', new loaded.binding.LexerSession())
}
