import { initToolingWasm, type InitToolingWasmOptions } from '@master/css-wasm-tooling'
import { bindLexerSession, type LexerSession } from './session'

export { LexerSessionError, type LexerSession } from './session'

export async function createLexerSession(
  options: { wasm?: InitToolingWasmOptions } = {}
): Promise<LexerSession> {
  const tooling = await initToolingWasm(options.wasm)
  const raw = new tooling.ToolingLexerSession()
  return bindLexerSession('wasm', {
    analyze: (request) => raw.analyze(request),
    dispose() {
      raw.dispose()
      raw.free()
    }
  })
}
