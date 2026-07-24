import { readFile } from 'node:fs/promises'
import {
  createMasterCSSCompilerWasmProvider as createBrowserProvider,
  type MasterCSSWasmCompilerLoadOptions
} from './provider'

export type { MasterCSSWasmCompilerLoadOptions } from './provider'

const defaultWasmURL = new URL(
  '../artifacts/mastercss_binding_wasm_compiler_bg.wasm',
  import.meta.url
)

export async function createMasterCSSCompilerWasmProvider(
  options: MasterCSSWasmCompilerLoadOptions = {}
): Promise<object> {
  return await createBrowserProvider(options.input
    ? options
    : {
      ...options,
      input: new Uint8Array(await readFile(defaultWasmURL))
    })
}
