import { readFile } from 'node:fs/promises'
import {
  createMasterCSSToolingWasmProvider as createBrowserProvider,
  type MasterCSSWasmToolingLoadOptions
} from './provider'

export type { MasterCSSWasmToolingLoadOptions } from './provider'

const defaultWasmURL = new URL(
  '../artifacts/mastercss_wasm_tooling_bg.wasm',
  import.meta.url
)

export async function createMasterCSSToolingWasmProvider(
  options: MasterCSSWasmToolingLoadOptions = {}
): Promise<object> {
  return await createBrowserProvider(options.input
    ? options
    : {
      ...options,
      input: new Uint8Array(await readFile(defaultWasmURL))
    })
}
