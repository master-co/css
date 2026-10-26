import {
  MasterCSSError
} from '@master/css-schema'
import { createMasterCSSEngineWasmProvider } from '@master/css-binding-wasm-engine'
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
  MasterCSSEngineSource,
  MasterCSSNativeBindingLoadOptions,
  MasterCSSRenderBindingSession,
  MasterCSSRenderBindingSessionOptions,
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

/** Browsers execute compiled programs; compiling a manifest is a Node build step. */
function programRequired(): never {
  throw new MasterCSSError({
    code: 'INVALID_INPUT',
    domain: 'binding',
    message: 'Master CSS engines in browsers execute compiled runtime programs, not manifests. '
      + 'Compile the manifest with compileRuntimeProgram() from @master/css/node and pass { program }.'
  })
}

function program(source: MasterCSSManifest | Uint8Array) {
  return ArrayBuffer.isView(source) ? source : programRequired()
}

export function createEngineBindingSession(
  options: MasterCSSEngineBindingSessionOptions,
  loadOptions: MasterCSSBindingLoadOptions = {}
): Promise<MasterCSSEngineBindingSession> {
  const resolved = browserOptions(loadOptions)
  return callBindingAsync('engine', async () => {
    const session = await createWasmEngineBindingSession(
      { program: program(options.program ?? options.manifest), emittedGlobals: options.emittedGlobals },
      resolved.wasm,
      createMasterCSSEngineWasmProvider
    )
    return bindEngineBindingSession('wasm', {
      ...session,
      refresh: (source, emittedGlobals) => session.refresh(program(source), emittedGlobals)
    })
  })
}

export function createRenderBindingSession(
  options: MasterCSSRenderBindingSessionOptions,
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

export function compileRuntimeProgram(
  _manifest: MasterCSSManifest,
  _loadOptions: MasterCSSBindingLoadOptions = {}
): Promise<Uint8Array> {
  return callBindingAsync('engine', async () => programRequired())
}
