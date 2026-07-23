import type { MasterCSSBackend } from './protocol'
import { MasterCSSError } from '@master/css-schema'

export interface MasterCSSNativeBackendLoadOptions {
  readonly bindingPath?: string
}

export interface MasterCSSWasmBackendLoadOptions {
  readonly module?: object
  readonly input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module
}

export interface MasterCSSBackendLoadOptions {
  readonly backend?: MasterCSSBackend
  readonly native?: MasterCSSNativeBackendLoadOptions
  readonly wasm?: MasterCSSWasmBackendLoadOptions
}

export function hasMasterCSSNodeRuntime() {
  const processLike = (globalThis as {
    process?: { versions?: { node?: unknown } }
  }).process
  return typeof processLike?.versions?.node === 'string'
}

export function shouldLoadMasterCSSNativeBackend(backend: MasterCSSBackend | undefined) {
  const hasNode = hasMasterCSSNodeRuntime()
  if (backend === 'native' && !hasNode) {
    throw new MasterCSSError({
      code: 'NATIVE_UNAVAILABLE',
      domain: 'backend',
      message: 'Master CSS native bindings are unavailable outside Node.js.'
    })
  }
  return backend !== 'wasm' && hasNode
}
