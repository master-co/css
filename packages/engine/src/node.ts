import { loadNativeBinding, NativeBindingError } from '@master/css-native'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import BoundEngine from './bound-engine'
import {
  MasterCSSEngineError,
  normalizeEngineError,
  type MasterCSSEngine,
  type MasterCSSEngineOptions
} from './backend'

export type {
  MasterCSSEngine,
  MasterCSSEngineOptions
} from './backend'

export function createEngineSync(options: MasterCSSEngineOptions): MasterCSSEngine {
  if (options.backend === 'wasm') {
    throw new MasterCSSEngineError(
      'NATIVE_UNAVAILABLE',
      'createEngineSync() only supports the native backend. Use createEngine() for Wasm.'
    )
  }
  try {
    const loaded = loadNativeBinding({ required: true })!
    const session = new loaded.binding.EngineSession(
      stringifyMasterCSSManifestJSON(options.manifest),
      options.emittedGlobals ? JSON.stringify(options.emittedGlobals) : undefined
    )
    return new BoundEngine('native', session)
  } catch (cause) {
    if (cause instanceof NativeBindingError) {
      throw new MasterCSSEngineError(cause.code, cause.message, { cause })
    }
    throw normalizeEngineError(cause)
  }
}
