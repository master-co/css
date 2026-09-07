import type { MasterCSSBinding } from './protocol'
import { MasterCSSError } from '@master/css-schema'

export interface MasterCSSNativeBindingLoadOptions {
  readonly bindingPath?: string
}

export interface MasterCSSWasmBindingLoadOptions {
  readonly module?: object
  readonly input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module
}

export interface MasterCSSBindingLoadOptions {
  readonly binding?: MasterCSSBinding
  readonly native?: MasterCSSNativeBindingLoadOptions
  readonly wasm?: MasterCSSWasmBindingLoadOptions
}

export function hasMasterCSSNodeRuntime() {
  const processLike = (globalThis as {
    process?: { versions?: { node?: unknown } }
  }).process
  return typeof processLike?.versions?.node === 'string'
}

export function shouldLoadMasterCSSNativeBinding(binding: MasterCSSBinding | undefined) {
  const hasNode = hasMasterCSSNodeRuntime()
  if (binding === 'native' && !hasNode) {
    throw new MasterCSSError({
      code: 'NATIVE_UNAVAILABLE',
      domain: 'binding',
      message: 'Master CSS native bindings are unavailable outside Node.js.'
    })
  }
  return binding !== 'wasm' && hasNode
}
