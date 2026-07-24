import {
  createToolingBinding,
  type MasterCSSWasmBindingLoadOptions
} from '@master/css-binding/tooling'
import { bindLexerSession, type LexerSession } from './session'

export { LexerSessionError, type LexerSession } from './session'

export async function createLexerSession(
  options: { wasm?: MasterCSSWasmBindingLoadOptions } = {}
): Promise<LexerSession> {
  const tooling = await createToolingBinding({ binding: 'wasm', wasm: options.wasm })
  return bindLexerSession(tooling.binding, await tooling.createLexerSession())
}
