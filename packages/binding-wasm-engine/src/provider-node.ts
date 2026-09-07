import { readFile } from 'node:fs/promises'
import {
  createMasterCSSEngineWasmProvider as createBrowserProvider,
  type MasterCSSWasmEngineLoadOptions
} from './provider'

export type {
  MasterCSSWasmEngineLoadOptions
} from './provider'

const defaultWasmURL = new URL('../artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url)

function resolveFileURL(input: MasterCSSWasmEngineLoadOptions['input']) {
  if (input instanceof URL) return input.protocol === 'file:' ? input : undefined
  if (typeof input !== 'string' || !input.startsWith('file:')) return
  return new URL(input)
}

async function withNodeWasmInput(
  options: MasterCSSWasmEngineLoadOptions
): Promise<MasterCSSWasmEngineLoadOptions> {
  const fileURL = options.input === undefined
    ? defaultWasmURL
    : resolveFileURL(options.input)
  if (!fileURL) return options
  return {
    ...options,
    input: new Uint8Array(await readFile(fileURL))
  }
}

export async function createMasterCSSEngineWasmProvider(
  options: MasterCSSWasmEngineLoadOptions = {}
): Promise<object> {
  return await createBrowserProvider(await withNodeWasmInput(options))
}
