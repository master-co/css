import {
  createToolingBackend,
  type MasterCSSWasmBackendLoadOptions
} from '@master/css-backend/tooling'
import { bindLexerSession, type LexerSession } from './session'

export { LexerSessionError, type LexerSession } from './session'

export async function createLexerSession(
  options: { wasm?: MasterCSSWasmBackendLoadOptions } = {}
): Promise<LexerSession> {
  const tooling = await createToolingBackend({ backend: 'wasm', wasm: options.wasm })
  return bindLexerSession(tooling.backend, await tooling.createLexerSession())
}
