import { readFile } from 'node:fs/promises'
import {
  createMasterCSSEngineWasmProvider as createBrowserProvider,
  type MasterCSSWasmEngineLoadOptions
} from './provider'

export type {
  MasterCSSWasmEngineLoadOptions
} from './provider'

const defaultWasmURL = new URL('../artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url)

export async function createMasterCSSEngineWasmProvider(
  options: MasterCSSWasmEngineLoadOptions = {}
): Promise<object> {
  return await createBrowserProvider(options.input
    ? options
    : {
      ...options,
      input: new Uint8Array(await readFile(defaultWasmURL))
    })
}
