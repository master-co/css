import { readFile } from 'node:fs/promises'
import { wasmEngine } from './artifact'
import {
  type MasterCSSWasmEngineLoadOptions,
  type MasterCSSWasmEngineSessionOptions,
  type MasterCSSWasmEngineSource
} from './index'

export type {
  MasterCSSWasmEngineLoadOptions,
  MasterCSSWasmEngineSessionOptions,
  MasterCSSWasmEngineSource
} from './index'

export { wasmEngine }

function resolveFileURL(input: MasterCSSWasmEngineLoadOptions['input']) {
  if (input instanceof URL) return input.protocol === 'file:' ? input : undefined
  if (typeof input !== 'string' || !input.startsWith('file:')) return
  return new URL(input)
}

export async function withNodeWasmInput(
  options: MasterCSSWasmEngineLoadOptions
): Promise<MasterCSSWasmEngineLoadOptions> {
  const fileURL = options.input === undefined
    ? wasmEngine.url
    : resolveFileURL(options.input)
  if (!fileURL) return options
  return {
    ...options,
    input: new Uint8Array(await readFile(fileURL))
  }
}

export async function loadWasmEngine(options: MasterCSSWasmEngineLoadOptions = {}) {
  return await wasmEngine.loadWasmEngine(await withNodeWasmInput(options))
}

export async function createWasmEngineSession(
  source: MasterCSSWasmEngineSource,
  sessionOptions: MasterCSSWasmEngineSessionOptions = {},
  loadOptions: MasterCSSWasmEngineLoadOptions = {}
) {
  return await wasmEngine.createWasmEngineSession(
    source,
    sessionOptions,
    await withNodeWasmInput(loadOptions)
  )
}

export async function compileRuntimeProgram(
  manifestJSON: string,
  loadOptions: MasterCSSWasmEngineLoadOptions = {}
) {
  return await wasmEngine.compileRuntimeProgram(
    manifestJSON,
    await withNodeWasmInput(loadOptions)
  )
}

export async function createWasmRenderSession(
  manifestJSON: string,
  sessionOptions: MasterCSSWasmEngineSessionOptions = {},
  loadOptions: MasterCSSWasmEngineLoadOptions = {}
) {
  return await wasmEngine.createWasmRenderSession(
    manifestJSON,
    sessionOptions,
    await withNodeWasmInput(loadOptions)
  )
}
