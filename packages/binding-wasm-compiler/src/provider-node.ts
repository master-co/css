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

function resolveFileURL(input: MasterCSSWasmCompilerLoadOptions['input']) {
  if (input instanceof URL) return input.protocol === 'file:' ? input : undefined
  if (typeof input !== 'string' || !input.startsWith('file:')) return
  return new URL(input)
}

async function withNodeWasmInput(
  options: MasterCSSWasmCompilerLoadOptions
): Promise<MasterCSSWasmCompilerLoadOptions> {
  const fileURL = options.input === undefined
    ? defaultWasmURL
    : resolveFileURL(options.input)
  if (!fileURL) return options
  return {
    ...options,
    input: new Uint8Array(await readFile(fileURL))
  }
}

export async function createMasterCSSCompilerWasmProvider(
  options: MasterCSSWasmCompilerLoadOptions = {}
): Promise<object> {
  return await createBrowserProvider(await withNodeWasmInput(options))
}
