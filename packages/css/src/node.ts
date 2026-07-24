import {
  createEngineBindingSessionSync,
  createRenderBindingSessionSync
} from '@master/css-binding/engine/node'
import { MasterCSSError } from '@master/css-schema'
import {
  MasterCSSRenderSession,
  bindRenderSessionInternal,
  type MasterCSSRenderSessionOptions
} from './render-session'
import BoundEngine from './engine/bound-engine'
import {
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
  MasterCSSEngineOptions
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
    return options.binding.createEngineSync({
      manifest: options.manifest,
      emittedGlobals: options.emittedGlobals
    })
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

export function createRenderSessionSync(
  options: MasterCSSRenderSessionOptions
): MasterCSSRenderSession {
  const native = createRenderBindingSessionSync(options)
  return bindRenderSessionInternal(
    {
      nativeDeclarationCandidates: (classNames) => native.nativeDeclarationCandidates(classNames),
      ensureClasses: (classNames, nativeSupport) =>
        native.ensureClassRules(classNames, nativeSupport ? [...nativeSupport] : undefined),
      ensureStylesheetResources: (nativeCSS) => native.ensureStylesheetResources(nativeCSS),
      emittedGlobals: () => native.emittedGlobals(),
      snapshot: () => native.snapshot(),
      snapshotForClasses: (classNames) => native.snapshotForClassNames(classNames),
      dispose: () => native.dispose()
    },
    options.supportsNativeDeclaration
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
  type MasterCSSNativeDeclarationSupport,
  type MasterCSSRenderSessionOptions,
  type MasterCSSRenderSnapshot
} from './render-session'
