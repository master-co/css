import {
  MasterCSSError
} from '@master/css-schema'
import { createMasterCSSEngineWasmProvider } from '@master/css-binding-wasm-engine'
import {
  type MasterCSSBindingLoadOptions,
  type MasterCSSEngineBindingSession,
  type MasterCSSEngineBindingSessionOptions,
  type MasterCSSNativeBindingLoadOptions,
  type MasterCSSRenderBindingSession,
  type MasterCSSWasmBindingLoadOptions
} from './engine-binding'
import {
  createWasmEngineBindingSession,
  createWasmRenderBindingSession
} from './engine-binding-wasm'
import {
  bindEngineBindingSession,
  bindRenderBindingSession
} from './engine-binding-adapter'
import { callBindingAsync } from './normalize-error'

export type {
  MasterCSSBindingLoadOptions,
  MasterCSSEngineBindingSession,
  MasterCSSEngineBindingSessionOptions,
  MasterCSSNativeBindingLoadOptions,
  MasterCSSRenderBindingSession,
  MasterCSSWasmBindingLoadOptions
}

function browserOptions(options: MasterCSSBindingLoadOptions): MasterCSSBindingLoadOptions {
  if (options.binding === 'native') {
    throw new MasterCSSError({
      code: 'NATIVE_UNAVAILABLE',
      domain: 'binding',
      message: 'Master CSS native bindings are unavailable in browsers.'
    })
  }
  return { ...options, binding: 'wasm' }
}

export function createEngineBindingSession(
  options: MasterCSSEngineBindingSessionOptions,
  loadOptions: MasterCSSBindingLoadOptions = {}
): Promise<MasterCSSEngineBindingSession> {
  const resolved = browserOptions(loadOptions)
  return callBindingAsync('engine', async () => bindEngineBindingSession(
    'wasm',
    await createWasmEngineBindingSession(
      options,
      resolved.wasm,
      createMasterCSSEngineWasmProvider
    )
  ))
}

export function createRenderBindingSession(
  options: MasterCSSEngineBindingSessionOptions,
  loadOptions: MasterCSSBindingLoadOptions = {}
): Promise<MasterCSSRenderBindingSession> {
  const resolved = browserOptions(loadOptions)
  return callBindingAsync('server', async () => bindRenderBindingSession(
    'wasm',
    await createWasmRenderBindingSession(
      options,
      resolved.wasm,
      createMasterCSSEngineWasmProvider
    )
  ))
}
