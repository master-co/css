import { readFile } from 'node:fs/promises'
import {
  createRuntimeWasmSession as createRuntimeWasmSessionBase,
  initRuntimeWasm as initRuntimeWasmBase,
  type InitRuntimeWasmOptions
} from './index'

export type { InitRuntimeWasmOptions } from './index'

const defaultWasmURL = new URL('../artifacts/mastercss_wasm_runtime_bg.wasm', import.meta.url)

async function withNodeWasmInput(options: InitRuntimeWasmOptions): Promise<InitRuntimeWasmOptions> {
  if (options.input) return options
  return {
    ...options,
    input: new Uint8Array(await readFile(defaultWasmURL))
  }
}

export function initRuntimeWasm(
  options: InitRuntimeWasmOptions = {}
): ReturnType<typeof initRuntimeWasmBase> {
  return withNodeWasmInput(options).then(initRuntimeWasmBase)
}

export async function createRuntimeWasmSession(
  manifestJSON: string,
  options: InitRuntimeWasmOptions = {}
) {
  return await createRuntimeWasmSessionBase(manifestJSON, await withNodeWasmInput(options))
}
