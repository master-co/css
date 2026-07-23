import type {
  MasterCSSLexerBatch,
  MasterCSSLexerBatchRequest,
  MasterCSSLexerClassListInput,
  MasterCSSLexerClassListItem,
  MasterCSSLexerCSSAnalysis
} from '@master/css-backend/tooling'
import { MASTER_CSS_LEXER_BATCH_VERSION } from '@master/css-backend/tooling'

export type LexerClassListInputIR = MasterCSSLexerClassListInput
export type LexerBatchRequest = MasterCSSLexerBatchRequest
export type LexerClassListItemIR = MasterCSSLexerClassListItem
export type LexerCssAnalysisIR = MasterCSSLexerCSSAnalysis
export type LexerBatchIR = MasterCSSLexerBatch

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
  const result = value as LexerBatchIR
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
      return parse(session.analyze(request))
    },
    dispose: () => session.dispose()
  }
}
