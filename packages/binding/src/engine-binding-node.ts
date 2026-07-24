import {
  createNativeEngineSession,
  createNativeRenderSession
} from './engine'
import type {
  MasterCSSNativeBindingLoadOptions,
  MasterCSSEngineBindingSession,
  MasterCSSEngineBindingSessionOptions,
  MasterCSSRenderBindingSession
} from './engine-binding'
import { normalizeBindingError } from './normalize-error'
import {
  bindEngineBindingSession,
  bindRenderBindingSession
} from './engine-binding-adapter'

export type {
  MasterCSSNativeBindingLoadOptions,
  MasterCSSEngineBindingSession,
  MasterCSSEngineBindingSessionOptions,
  MasterCSSRenderBindingSession
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
  options: MasterCSSEngineBindingSessionOptions,
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
