import {
  createNativeEngineSession,
  createNativeRenderSession
} from '@master/css-backend/engine'
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
  type MasterCSSEngineBackend,
  type MasterCSSEngineBackendOptions,
  type MasterCSSEngineOptions
} from './engine/backend'

export type {
  MasterCSSEngine,
  MasterCSSEngineBackend,
  MasterCSSEngineBackendOptions,
  MasterCSSEngineOptions
} from './engine/backend'

function createNativeEngine(options: MasterCSSEngineBackendOptions): MasterCSSEngine {
  const session = createNativeEngineSession(options, { required: true })!
  return new BoundEngine('native', session)
}

export function createNativeEngineBackend(): MasterCSSEngineBackend {
  return Object.freeze({
    kind: 'native',
    async createEngine(options: MasterCSSEngineBackendOptions) {
      return createNativeEngine(options)
    },
    createEngineSync(options: MasterCSSEngineBackendOptions) {
      return createNativeEngine(options)
    }
  })
}

export function createEngineSync(options: MasterCSSEngineOptions): MasterCSSEngine {
  if (options.backend && typeof options.backend === 'object') {
    if (!options.backend.createEngineSync) {
      throw new MasterCSSError({
        code: 'NATIVE_UNAVAILABLE',
        domain: 'engine',
        message: 'The injected Master CSS backend does not support synchronous engine creation.'
      })
    }
    return options.backend.createEngineSync({
      manifest: options.manifest,
      emittedGlobals: options.emittedGlobals
    })
  }
  if (options.backend === 'wasm') {
    throw new MasterCSSError({
      code: 'NATIVE_UNAVAILABLE',
      domain: 'engine',
      message: 'createEngineSync() only supports the native backend. Use createEngine() for Wasm.'
    })
  }
  try {
    return createNativeEngine(options)
  } catch (cause) {
    if (cause instanceof MasterCSSError && cause.domain === 'backend') {
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
  const native = createNativeRenderSession(options, { required: true })!
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
