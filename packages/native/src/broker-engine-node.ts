import {
  createNativeEngineSession,
  createNativeRenderSession
} from './engine'
import type {
  MasterCSSNativeBackendLoadOptions,
  MasterCSSEngineBackendSession,
  MasterCSSEngineBackendSessionOptions,
  MasterCSSRenderBackendSession
} from './broker-engine'
import { normalizeBackendError } from './normalize-error'
import {
  bindEngineBackendSession,
  bindRenderBackendSession
} from './broker-engine-adapter'

export type {
  MasterCSSNativeBackendLoadOptions,
  MasterCSSEngineBackendSession,
  MasterCSSEngineBackendSessionOptions,
  MasterCSSRenderBackendSession
} from './broker-engine'

export function createEngineBackendSessionSync(
  options: MasterCSSEngineBackendSessionOptions,
  loadOptions: MasterCSSNativeBackendLoadOptions = {}
): MasterCSSEngineBackendSession {
  try {
    const session = createNativeEngineSession(options, {
      ...loadOptions,
      required: true
    })!
    return bindEngineBackendSession('native', session)
  } catch (cause) {
    throw normalizeBackendError(cause, 'engine')
  }
}

export function createRenderBackendSessionSync(
  options: MasterCSSEngineBackendSessionOptions,
  loadOptions: MasterCSSNativeBackendLoadOptions = {}
): MasterCSSRenderBackendSession {
  try {
    const session = createNativeRenderSession(options, {
      ...loadOptions,
      required: true
    })!
    return bindRenderBackendSession('native', session)
  } catch (cause) {
    throw normalizeBackendError(cause, 'server')
  }
}
