import { compileRuntimeProgram as compileBindingRuntimeProgram } from '@master/css-binding/engine'
import {
  compileRuntimeProgramSync as compileBindingRuntimeProgramSync,
  createEngineBindingSessionSync,
  createRenderBindingSessionSync
} from '@master/css-binding/engine/node'
import type { MasterCSSBinding } from '@master/css-binding'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { MasterCSSError } from '@master/css-schema'
import {
  MasterCSSRenderSession,
  bindRenderSessionInternal,
  type MasterCSSRenderSessionOptions
} from './render-session'
import BoundEngine from './engine/bound-engine'
import {
  engineSource,
  normalizeEngineError,
  type MasterCSSEngine,
  type MasterCSSEngineBinding,
  type MasterCSSEngineBindingOptions,
  type MasterCSSEngineOptions
} from './engine/binding'

export type {
  MasterCSSEngine,
  MasterCSSEngineBinding,
  MasterCSSEngineBindingOptions,
  MasterCSSEngineOptions,
  MasterCSSEngineSource
} from './engine/binding'

function createNativeEngine(options: MasterCSSEngineBindingOptions): MasterCSSEngine {
  const session = createEngineBindingSessionSync(options)
  return new BoundEngine('native', session)
}

export function createNativeEngineBinding(): MasterCSSEngineBinding {
  return Object.freeze({
    kind: 'native',
    async createEngine(options: MasterCSSEngineBindingOptions) {
      return createNativeEngine(options)
    },
    createEngineSync(options: MasterCSSEngineBindingOptions) {
      return createNativeEngine(options)
    }
  })
}

export function createEngineSync(options: MasterCSSEngineOptions): MasterCSSEngine {
  if (options.binding && typeof options.binding === 'object') {
    if (!options.binding.createEngineSync) {
      throw new MasterCSSError({
        code: 'NATIVE_UNAVAILABLE',
        domain: 'engine',
        message: 'The injected Master CSS binding does not support synchronous engine creation.'
      })
    }
    return options.binding.createEngineSync(engineSource(options))
  }
  if (options.binding === 'wasm') {
    throw new MasterCSSError({
      code: 'NATIVE_UNAVAILABLE',
      domain: 'engine',
      message: 'createEngineSync() only supports the native binding. Use createEngine() for Wasm.'
    })
  }
  try {
    return createNativeEngine(options)
  } catch (cause) {
    if (cause instanceof MasterCSSError && cause.domain === 'binding') {
      throw new MasterCSSError({
        code: cause.code,
        domain: 'engine',
        message: cause.message
      }, { cause })
    }
    throw normalizeEngineError(cause)
  }
}

export interface MasterCSSCompileRuntimeProgramOptions {
  readonly binding?: MasterCSSBinding
}

/**
 * Compiles a manifest into the runtime program that browser engines execute, with
 * the native binding or, when it is unavailable, the Wasm one.
 */
export async function compileRuntimeProgram(
  manifest: MasterCSSManifest,
  options: MasterCSSCompileRuntimeProgramOptions = {}
): Promise<Uint8Array> {
  try {
    return await compileBindingRuntimeProgram(manifest, { binding: options.binding })
  } catch (cause) {
    throw normalizeEngineError(cause)
  }
}

/** Compiles a runtime program with the native binding. */
export function compileRuntimeProgramSync(manifest: MasterCSSManifest): Uint8Array {
  try {
    return compileBindingRuntimeProgramSync(manifest)
  } catch (cause) {
    throw normalizeEngineError(cause)
  }
}

export function createRenderSessionSync(
  options: MasterCSSRenderSessionOptions
): MasterCSSRenderSession {
  const native = createRenderBindingSessionSync(options)
  return bindRenderSessionInternal(
    {
      nativeDeclarationCandidates: (classNames) => native.nativeDeclarationCandidates(classNames),
      ensureClasses: (classNames) =>
        native.ensureClassRules(classNames),
      ensureStylesheetResources: (nativeCSS) => native.ensureStylesheetResources(nativeCSS),
      emittedGlobals: () => native.emittedGlobals(),
      snapshot: () => native.snapshot(),
      snapshotForClasses: (classNames) => native.snapshotForClassNames(classNames),
      dispose: () => native.dispose()
    }
  )
}

export function renderClassNamesSync(
  classNames: readonly string[],
  options: MasterCSSRenderSessionOptions
) {
  const session = createRenderSessionSync(options)
  try {
    return session.ensureClassRules(classNames)
  } finally {
    session.dispose()
  }
}

export {
  MasterCSSRenderSession,
  type MasterCSSNativeDeclaration,
  type MasterCSSRenderSessionOptions,
  type MasterCSSRenderSnapshot
} from './render-session'
