import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  compileNativeRuntimeProgram,
  createNativeEngineSession,
  createNativeRenderSession
} from './engine'
import type {
  MasterCSSNativeBindingLoadOptions,
  MasterCSSEngineBindingSession,
  MasterCSSEngineBindingSessionOptions,
  MasterCSSRenderBindingSession,
  MasterCSSRenderBindingSessionOptions
} from './engine-binding'
import { normalizeBindingError } from './normalize-error'
import {
  bindEngineBindingSession,
  bindRenderBindingSession
} from './engine-binding-adapter'

export type {
  MasterCSSEngineSource,
  MasterCSSNativeBindingLoadOptions,
  MasterCSSEngineBindingSession,
  MasterCSSEngineBindingSessionOptions,
  MasterCSSRenderBindingSession,
  MasterCSSRenderBindingSessionOptions
} from './engine-binding'

export function createEngineBindingSessionSync(
  options: MasterCSSEngineBindingSessionOptions,
  loadOptions: MasterCSSNativeBindingLoadOptions = {}
): MasterCSSEngineBindingSession {
  try {
    const session = createNativeEngineSession(options, {
      ...loadOptions,
      required: true
    })!
    return bindEngineBindingSession('native', session)
  } catch (cause) {
    throw normalizeBindingError(cause, 'engine')
  }
}

export function createRenderBindingSessionSync(
  options: MasterCSSRenderBindingSessionOptions,
  loadOptions: MasterCSSNativeBindingLoadOptions = {}
): MasterCSSRenderBindingSession {
  try {
    const session = createNativeRenderSession(options, {
      ...loadOptions,
      required: true
    })!
    return bindRenderBindingSession('native', session)
  } catch (cause) {
    throw normalizeBindingError(cause, 'server')
  }
}

/** Compiles a manifest into the runtime program that browsers execute. */
export function compileRuntimeProgramSync(
  manifest: MasterCSSManifest,
  loadOptions: MasterCSSNativeBindingLoadOptions = {}
): Uint8Array {
  try {
    return compileNativeRuntimeProgram(manifest, {
      ...loadOptions,
      required: true
    })!
  } catch (cause) {
    throw normalizeBindingError(cause, 'engine')
  }
}
