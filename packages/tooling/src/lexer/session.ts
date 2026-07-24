import type {
  MasterCSSLexerBatch,
  MasterCSSLexerBatchRequest
} from '@master/css-binding/tooling'
import { MASTER_CSS_LEXER_BATCH_VERSION } from '@master/css-binding/tooling'

export type LexerBatchRequest = MasterCSSLexerBatchRequest

interface BindingLexerSession {
  analyze(request: unknown): unknown
  dispose(): void
}

export interface LexerSession {
  readonly binding: 'native' | 'wasm'
  analyze(request: LexerBatchRequest): MasterCSSLexerBatch
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

function parse(value: unknown): MasterCSSLexerBatch {
  const result = value as MasterCSSLexerBatch
  if (result.version !== MASTER_CSS_LEXER_BATCH_VERSION) {
    throw new LexerSessionError(
      'LEXER_BATCH_VERSION_MISMATCH',
      `Expected Master CSS lexer batch version ${MASTER_CSS_LEXER_BATCH_VERSION}, received ${String(result.version)}.`
    )
  }
  return result
}

export function bindLexerSession(
  binding: LexerSession['binding'],
  session: BindingLexerSession
): LexerSession {
  return {
    binding,
    analyze(request) {
      return parse(session.analyze(request))
    },
    dispose: () => session.dispose()
  }
}
