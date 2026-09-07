import { readFile } from 'node:fs/promises'
import {
  createMasterCSSToolingWasmProvider as createBrowserProvider,
  type MasterCSSWasmToolingLoadOptions
} from './provider'

export type { MasterCSSWasmToolingLoadOptions } from './provider'

const defaultWasmURL = new URL(
  '../artifacts/mastercss_binding_wasm_tooling_bg.wasm',
  import.meta.url
)

function resolveFileURL(input: MasterCSSWasmToolingLoadOptions['input']) {
  if (input instanceof URL) return input.protocol === 'file:' ? input : undefined
  if (typeof input !== 'string' || !input.startsWith('file:')) return
  return new URL(input)
}

async function withNodeWasmInput(
  options: MasterCSSWasmToolingLoadOptions
): Promise<MasterCSSWasmToolingLoadOptions> {
  const fileURL = options.input === undefined
    ? defaultWasmURL
    : resolveFileURL(options.input)
  if (!fileURL) return options
  return {
    ...options,
    input: new Uint8Array(await readFile(fileURL))
  }
}

export async function createMasterCSSToolingWasmProvider(
  options: MasterCSSWasmToolingLoadOptions = {}
): Promise<object> {
  return await createBrowserProvider(await withNodeWasmInput(options))
}
