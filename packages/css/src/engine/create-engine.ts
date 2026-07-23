import type * as NativeModule from '@master/css-native'
import { createRuntimeWasmSession } from '@master/css-wasm-runtime'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import BoundEngine from './bound-engine'
import {
  MasterCSSEngineError,
  normalizeEngineError,
  type MasterCSSEngine,
  type MasterCSSEngineOptions
} from './backend'

async function createWasmEngine(options: MasterCSSEngineOptions): Promise<MasterCSSEngine> {
  try {
    const session = await createRuntimeWasmSession(
      stringifyMasterCSSManifestJSON(options.manifest),
      {
        emittedGlobalsJSON: options.emittedGlobals
          ? JSON.stringify(options.emittedGlobals)
          : undefined
      }
    )
    return new BoundEngine('wasm', session)
  } catch (cause) {
    throw normalizeEngineError(
      cause,
      'WASM_LOAD_FAILED',
      'Cannot initialize the Master CSS Wasm engine.'
    )
  }
}

async function importNativeModule(): Promise<typeof NativeModule> {
  // @master/css-native provides a browser condition without node:* imports, so this
  // remains safe for universal bundles while still working in VM-backed test runners.
  return await import('@master/css-native')
}

export default async function createEngine(
  options: MasterCSSEngineOptions
): Promise<MasterCSSEngine> {
  if (options.backend === 'wasm' || typeof process === 'undefined') {
    return await createWasmEngine(options)
  }

  try {
    const { loadNativeBinding } = await importNativeModule()
    const loaded = loadNativeBinding({ required: options.backend === 'native' })
    if (!loaded) return await createWasmEngine(options)
    return new BoundEngine(
      'native',
      new loaded.binding.EngineSession(
        stringifyMasterCSSManifestJSON(options.manifest),
        options.emittedGlobals ? JSON.stringify(options.emittedGlobals) : undefined
      )
    )
  } catch (cause) {
    if (cause && typeof cause === 'object' && 'code' in cause
      && (cause.code === 'NATIVE_UNAVAILABLE' || cause.code === 'NATIVE_LOAD_FAILED')) {
      throw new MasterCSSEngineError(cause.code, String('message' in cause ? cause.message : cause), { cause })
    }
    throw normalizeEngineError(cause)
  }
}
