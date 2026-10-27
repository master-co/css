import { MasterCSSError } from '@master/css-schema'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSNativeEngineSession,
  MasterCSSNativeEngineSessionOptions,
  MasterCSSNativeModuleOptions,
  MasterCSSNativeRenderSession,
  MasterCSSNativeRenderSessionOptions
} from './engine-contract'
import { NativeBindingError } from './errors'
import { loadNativeBinding } from './native-loader'

export type {
  MasterCSSEngineSource,
  MasterCSSNativeEngineSession,
  MasterCSSNativeEngineSessionOptions,
  MasterCSSNativeModuleOptions,
  MasterCSSNativeRenderSession,
  MasterCSSNativeRenderSessionOptions
} from './engine-contract'
export {
  MASTER_CSS_ENGINE_TRANSITION_VERSION,
  type MasterCSSEngineDeleteMutation,
  type MasterCSSEngineExecutionState,
  type MasterCSSEngineInspection,
  type MasterCSSEngineInsertMutation,
  type MasterCSSEngineMutation,
  type MasterCSSEngineResources,
  type MasterCSSEngineSnapshot,
  type MasterCSSEngineTransition,
  type MasterCSSEngineVariableResource,
  type MasterCSSNativeDeclarationCandidate,
  type MasterCSSRuleTarget,
  type MasterCSSServerRender
} from './protocol'

function parse<T>(value: string): T {
  return JSON.parse(value) as T
}

function globalsJSON(emittedGlobals: MasterCSSEmittedGlobals | undefined) {
  return emittedGlobals ? JSON.stringify(emittedGlobals) : undefined
}

function bindingError(cause: unknown): MasterCSSError {
  if (cause instanceof MasterCSSError) return cause
  if (!(cause instanceof NativeBindingError)) throw cause
  return new MasterCSSError({
    code: cause.code,
    domain: 'binding',
    message: cause.message
  }, { cause })
}

export function createNativeEngineSession(
  options: MasterCSSNativeEngineSessionOptions,
  moduleOptions: MasterCSSNativeModuleOptions = {}
): MasterCSSNativeEngineSession | undefined {
  try {
    const loaded = loadNativeBinding(moduleOptions)
    if (!loaded) return
    const { EngineSession } = loaded.binding
    const session = options.program
      ? EngineSession.fromProgram(options.program, globalsJSON(options.emittedGlobals))
      : new EngineSession(
        serializeMasterCSSManifest(options.manifest),
        globalsJSON(options.emittedGlobals)
      )
    let disposed = false
    const dispose = () => {
      if (disposed) return
      disposed = true
      session.dispose()
    }
    return {
      ensureClassRules: (classNames) => parse(session.ensureClassRules([...classNames])),
      deleteClassRules: (classNames) => parse(session.deleteClassRules([...classNames])),
      registerEmittedGlobals: (emittedGlobals) =>
        parse(session.registerEmittedGlobals(JSON.stringify(emittedGlobals))),
      replaceEmittedGlobals: (emittedGlobals) =>
        parse(session.replaceEmittedGlobals(JSON.stringify(emittedGlobals))),
      refresh: (source, emittedGlobals) => parse(ArrayBuffer.isView(source)
        ? session.refreshProgram(source, globalsJSON(emittedGlobals))
        : session.refresh(serializeMasterCSSManifest(source), globalsJSON(emittedGlobals))),
      keyframeDefinitions: () => parse(session.keyframeDefinitions()),
      executionState: (classNames) => parse(session.executionState([...classNames])),
      inspect: (className) => parse(session.inspect(className)),
      snapshot: () => parse(session.snapshot()),
      dispose,
      [Symbol.dispose]: dispose
    }
  } catch (cause) {
    throw bindingError(cause)
  }
}

export function createNativeRenderSession(
  options: MasterCSSNativeRenderSessionOptions,
  moduleOptions: MasterCSSNativeModuleOptions = {}
): MasterCSSNativeRenderSession | undefined {
  try {
    const loaded = loadNativeBinding(moduleOptions)
    if (!loaded) return
    const session = new loaded.binding.RenderSession(
      serializeMasterCSSManifest(options.manifest),
      globalsJSON(options.emittedGlobals)
    )
    let disposed = false
    const dispose = () => {
      if (disposed) return
      disposed = true
      session.dispose()
    }
    return {
      nativeDeclarationCandidates: (classNames) =>
        parse(session.nativeDeclarationCandidates([...classNames])),
      ensureClassRules: (classNames) =>
        session.ensureClasses([...classNames]),
      ensureStylesheetResources: (nativeCSS) => session.ensureStylesheetResources(nativeCSS),
      emittedGlobals: () => parse(session.emittedGlobals()),
      snapshot: () => parse(session.snapshot()),
      snapshotForClassNames: (classNames) => parse(session.snapshotForClasses([...classNames])),
      dispose,
      [Symbol.dispose]: dispose
    }
  } catch (cause) {
    throw bindingError(cause)
  }
}

/** Compiles a manifest into the runtime program that browsers execute. */
export function compileNativeRuntimeProgram(
  manifest: MasterCSSManifest,
  moduleOptions: MasterCSSNativeModuleOptions = {}
): Uint8Array | undefined {
  try {
    const loaded = loadNativeBinding(moduleOptions)
    if (!loaded) return
    return new Uint8Array(loaded.binding.compileRuntimeProgram(serializeMasterCSSManifest(manifest)))
  } catch (cause) {
    throw bindingError(cause)
  }
}
