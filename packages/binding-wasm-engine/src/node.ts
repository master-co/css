import { readFile } from 'node:fs/promises'
import {
  createWasmEngineSession as createWasmEngineSessionBase,
  createWasmRenderSession as createWasmRenderSessionBase,
  loadWasmEngine as loadWasmEngineBase,
  type MasterCSSWasmEngineLoadOptions,
  type MasterCSSWasmEngineSessionOptions
} from './index'

export type {
  MasterCSSWasmEngineLoadOptions,
  MasterCSSWasmEngineSessionOptions
} from './index'

const defaultWasmURL = new URL('../artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url)

async function withNodeWasmInput(
  options: MasterCSSWasmEngineLoadOptions
): Promise<MasterCSSWasmEngineLoadOptions> {
  if (options.input) return options
  return {
    ...options,
    input: new Uint8Array(await readFile(defaultWasmURL))
  }
}

export async function loadWasmEngine(options: MasterCSSWasmEngineLoadOptions = {}) {
  return await loadWasmEngineBase(await withNodeWasmInput(options))
}

export async function createWasmEngineSession(
  manifestJSON: string,
  sessionOptions: MasterCSSWasmEngineSessionOptions = {},
  loadOptions: MasterCSSWasmEngineLoadOptions = {}
) {
  return await createWasmEngineSessionBase(
    manifestJSON,
    sessionOptions,
    await withNodeWasmInput(loadOptions)
  )
}

export async function createWasmRenderSession(
  manifestJSON: string,
  sessionOptions: MasterCSSWasmEngineSessionOptions = {},
  loadOptions: MasterCSSWasmEngineLoadOptions = {}
) {
  return await createWasmRenderSessionBase(
    manifestJSON,
    sessionOptions,
    await withNodeWasmInput(loadOptions)
  )
}
