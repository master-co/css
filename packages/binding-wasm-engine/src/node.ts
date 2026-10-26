import { readFile } from 'node:fs/promises'
import {
  createWasmEngineLoader,
  type MasterCSSWasmEngineLoadOptions,
  type MasterCSSWasmEngineSessionOptions,
  type MasterCSSWasmEngineSource
} from './index'

export type {
  MasterCSSWasmEngineLoadOptions,
  MasterCSSWasmEngineSessionOptions,
  MasterCSSWasmEngineSource
} from './index'

// Node hosts also render on the server, so they load the module with every feature.
export const fullWasmEngine = createWasmEngineLoader({
  url: new URL('../artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url),
  load: () => import('../artifacts/mastercss_binding_wasm_engine.js')
})

function resolveFileURL(input: MasterCSSWasmEngineLoadOptions['input']) {
  if (input instanceof URL) return input.protocol === 'file:' ? input : undefined
  if (typeof input !== 'string' || !input.startsWith('file:')) return
  return new URL(input)
}

export async function withNodeWasmInput(
  options: MasterCSSWasmEngineLoadOptions
): Promise<MasterCSSWasmEngineLoadOptions> {
  const fileURL = options.input === undefined
    ? fullWasmEngine.url
    : resolveFileURL(options.input)
  if (!fileURL) return options
  return {
    ...options,
    input: new Uint8Array(await readFile(fileURL))
  }
}

export async function loadWasmEngine(options: MasterCSSWasmEngineLoadOptions = {}) {
  return await fullWasmEngine.loadWasmEngine(await withNodeWasmInput(options))
}

export async function createWasmEngineSession(
  source: MasterCSSWasmEngineSource,
  sessionOptions: MasterCSSWasmEngineSessionOptions = {},
  loadOptions: MasterCSSWasmEngineLoadOptions = {}
) {
  return await fullWasmEngine.createWasmEngineSession(
    source,
    sessionOptions,
    await withNodeWasmInput(loadOptions)
  )
}

export async function compileRuntimeProgram(
  manifestJSON: string,
  loadOptions: MasterCSSWasmEngineLoadOptions = {}
) {
  return await fullWasmEngine.compileRuntimeProgram(
    manifestJSON,
    await withNodeWasmInput(loadOptions)
  )
}

export async function createWasmRenderSession(
  manifestJSON: string,
  sessionOptions: MasterCSSWasmEngineSessionOptions = {},
  loadOptions: MasterCSSWasmEngineLoadOptions = {}
) {
  return await fullWasmEngine.createWasmRenderSession(
    manifestJSON,
    sessionOptions,
    await withNodeWasmInput(loadOptions)
  )
}
