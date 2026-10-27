import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  type MasterCSSBindingLoadOptions,
  type MasterCSSEngineBindingSession,
  type MasterCSSEngineBindingSessionOptions,
  type MasterCSSEngineSource,
  type MasterCSSNativeBindingLoadOptions,
  type MasterCSSRenderBindingSession,
  type MasterCSSRenderBindingSessionOptions,
  type MasterCSSWasmBindingLoadOptions
} from './engine-binding'
import { createJavaScriptEngineBindingSession, programRequired } from './engine-binding-js'
import { callBindingAsync } from './normalize-error'

export type {
  MasterCSSBindingLoadOptions,
  MasterCSSEngineBindingSession,
  MasterCSSEngineBindingSessionOptions,
  MasterCSSEngineSource,
  MasterCSSNativeBindingLoadOptions,
  MasterCSSRenderBindingSession,
  MasterCSSRenderBindingSessionOptions,
  MasterCSSWasmBindingLoadOptions
}

// Browsers execute compiled programs with the JavaScript engine. Native and Wasm
// engines, manifest compilation and rendering run in Node.

function assertBrowserBinding(options: MasterCSSBindingLoadOptions) {
  if (options.binding === 'native') {
    throw new MasterCSSError({
      code: 'NATIVE_UNAVAILABLE',
      domain: 'binding',
      message: 'Master CSS native bindings are unavailable in browsers.'
    })
  }
  if (options.binding === 'wasm') {
    throw new MasterCSSError({
      code: 'WASM_UNAVAILABLE',
      domain: 'binding',
      message: 'Master CSS Wasm engines are unavailable in browsers, which execute programs with the JavaScript engine.'
    })
  }
}

export function createEngineBindingSession(
  options: MasterCSSEngineBindingSessionOptions,
  loadOptions: MasterCSSBindingLoadOptions = {}
): Promise<MasterCSSEngineBindingSession> {
  return callBindingAsync('engine', async () => {
    assertBrowserBinding(loadOptions)
    return createJavaScriptEngineBindingSession(options)
  })
}

export function createRenderBindingSession(
  _options: MasterCSSRenderBindingSessionOptions,
  _loadOptions: MasterCSSBindingLoadOptions = {}
): Promise<MasterCSSRenderBindingSession> {
  return callBindingAsync('server', async () => {
    throw new MasterCSSError({
      code: 'FEATURE_UNAVAILABLE',
      domain: 'server',
      message: 'Master CSS rendering is unavailable in browsers; use @master/css/node.'
    })
  })
}

export function compileRuntimeProgram(
  _manifest: MasterCSSManifest,
  _loadOptions: MasterCSSBindingLoadOptions = {}
): Promise<Uint8Array> {
  return callBindingAsync('engine', async () => programRequired())
}
