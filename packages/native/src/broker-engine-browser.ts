import {
  MasterCSSError
} from '@master/css-schema'
import { createMasterCSSEngineWasmProvider } from '@master/css-wasm-engine'
import {
  type MasterCSSBackendLoadOptions,
  type MasterCSSEngineBackendSession,
  type MasterCSSEngineBackendSessionOptions,
  type MasterCSSNativeBackendLoadOptions,
  type MasterCSSRenderBackendSession,
  type MasterCSSWasmBackendLoadOptions
} from './broker-engine'
import {
  createWasmEngineBackendSession,
  createWasmRenderBackendSession
} from './broker-engine-wasm'
import {
  bindEngineBackendSession,
  bindRenderBackendSession
} from './broker-engine-adapter'
import { callBackendAsync } from './normalize-error'

export type {
  MasterCSSBackendLoadOptions,
  MasterCSSEngineBackendSession,
  MasterCSSEngineBackendSessionOptions,
  MasterCSSNativeBackendLoadOptions,
  MasterCSSRenderBackendSession,
  MasterCSSWasmBackendLoadOptions
}

function browserOptions(options: MasterCSSBackendLoadOptions): MasterCSSBackendLoadOptions {
  if (options.backend === 'native') {
    throw new MasterCSSError({
      code: 'NATIVE_UNAVAILABLE',
      domain: 'backend',
      message: 'Master CSS native bindings are unavailable in browsers.'
    })
  }
  return { ...options, backend: 'wasm' }
}

export function createEngineBackendSession(
  options: MasterCSSEngineBackendSessionOptions,
  loadOptions: MasterCSSBackendLoadOptions = {}
): Promise<MasterCSSEngineBackendSession> {
  const resolved = browserOptions(loadOptions)
  return callBackendAsync('engine', async () => bindEngineBackendSession(
    'wasm',
    await createWasmEngineBackendSession(
      options,
      resolved.wasm,
      createMasterCSSEngineWasmProvider
    )
  ))
}

export function createRenderBackendSession(
  options: MasterCSSEngineBackendSessionOptions,
  loadOptions: MasterCSSBackendLoadOptions = {}
): Promise<MasterCSSRenderBackendSession> {
  const resolved = browserOptions(loadOptions)
  return callBackendAsync('server', async () => bindRenderBackendSession(
    'wasm',
    await createWasmRenderBackendSession(
      options,
      resolved.wasm,
      createMasterCSSEngineWasmProvider
    )
  ))
}
