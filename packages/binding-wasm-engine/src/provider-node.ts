import { fullWasmEngine, withNodeWasmInput } from './node'
import type { MasterCSSWasmEngineLoadOptions } from './provider'
import { createWasmEngineProvider } from './provider-core'

export type {
  MasterCSSWasmEngineLoadOptions
} from './provider'

export async function createMasterCSSEngineWasmProvider(
  options: MasterCSSWasmEngineLoadOptions = {}
): Promise<object> {
  return await createWasmEngineProvider(fullWasmEngine, await withNodeWasmInput(options))
}
