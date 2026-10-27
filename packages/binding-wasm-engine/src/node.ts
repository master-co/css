import { readFile } from 'node:fs/promises'
import { fullWasmEngine } from './full-artifact'
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

export { fullWasmEngine }

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
