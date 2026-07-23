import type * as NativeModule from '@master/css-backend/engine'
import { createWasmEngineSession } from '@master/css-wasm-engine'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import BoundEngine from './bound-engine'
import {
  normalizeEngineError,
  type BackendEngineSession,
  type MasterCSSEngine,
  type MasterCSSEngineOptions
} from './backend'

async function createWasmEngine(options: MasterCSSEngineOptions): Promise<MasterCSSEngine> {
  try {
    const session = await createWasmEngineSession(
      serializeMasterCSSManifest(options.manifest),
      {
        emittedGlobals: options.emittedGlobals
      }
    )
    return new BoundEngine('wasm', {
      ensureClassRules: (classNames) => session.ensureClassRules([...classNames]),
      deleteClassRules: (classNames) => session.deleteClassRules([...classNames]),
      refresh: (manifest) => session.refresh(serializeMasterCSSManifest(manifest)),
      inspect: (className) => session.inspect(className),
      snapshot: () => session.snapshot(),
      dispose: () => session.dispose()
    } as BackendEngineSession)
  } catch (cause) {
    throw normalizeEngineError(
      cause,
      'WASM_LOAD_FAILED',
      'Cannot initialize the Master CSS Wasm engine.'
    )
  }
}

async function importNativeModule(): Promise<typeof NativeModule> {
  // @master/css-backend provides a browser condition without node:* imports, so this
  // remains safe for universal bundles while still working in VM-backed test runners.
  return await import('@master/css-backend/engine')
}

export default async function createEngine(
  options: MasterCSSEngineOptions
): Promise<MasterCSSEngine> {
  if (options.backend && typeof options.backend === 'object') {
    return await options.backend.createEngine({
      manifest: options.manifest,
      emittedGlobals: options.emittedGlobals
    })
  }
  if (options.backend === 'wasm' || typeof process === 'undefined') {
    return await createWasmEngine(options)
  }

  try {
    const { createNativeEngineSession } = await importNativeModule()
    const session = createNativeEngineSession(options, {
      required: options.backend === 'native'
    })
    if (!session) return await createWasmEngine(options)
    return new BoundEngine(
      'native',
      session
    )
  } catch (cause) {
    if (cause && typeof cause === 'object' && 'code' in cause
      && (cause.code === 'NATIVE_UNAVAILABLE' || cause.code === 'NATIVE_LOAD_FAILED')) {
      throw normalizeEngineError(
        cause,
        String(cause.code),
        String('message' in cause ? cause.message : cause)
      )
    }
    throw normalizeEngineError(cause)
  }
}
