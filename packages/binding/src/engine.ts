import { MasterCSSError } from '@master/css-schema'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSNativeEngineSession,
  MasterCSSNativeEngineSessionOptions,
  MasterCSSNativeModuleOptions,
  MasterCSSNativeRenderSession
} from './engine-contract'
import { NativeBindingError } from './errors'
import { loadNativeBinding } from './native-loader'

export type {
  MasterCSSNativeEngineSession,
  MasterCSSNativeEngineSessionOptions,
  MasterCSSNativeModuleOptions,
  MasterCSSNativeRenderSession
} from './engine-contract'
export {
  MASTER_CSS_ENGINE_TRANSITION_VERSION,
  type MasterCSSEngineAnimationResource,
  type MasterCSSEngineDeleteMutation,
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
    const session = new loaded.binding.EngineSession(
      serializeMasterCSSManifest(options.manifest),
      options.emittedGlobals ? JSON.stringify(options.emittedGlobals) : undefined
    )
    let disposed = false
    const dispose = () => {
      if (disposed) return
      disposed = true
      session.dispose()
    }
    return {
      ensureClassRules: (classNames) => {
        const values = [...classNames]
        const candidates = parse<unknown[]>(session.nativeDeclarationCandidates(values))
        return parse(session.ensureClassRulesWithNativeSupport(
          values,
          candidates.map(() => true)
        ))
      },
      deleteClassRules: (classNames) => parse(session.deleteClassRules([...classNames])),
      refresh: (manifest) => parse(session.refresh(serializeMasterCSSManifest(manifest))),
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
  options: MasterCSSNativeEngineSessionOptions,
  moduleOptions: MasterCSSNativeModuleOptions = {}
): MasterCSSNativeRenderSession | undefined {
  try {
    const loaded = loadNativeBinding(moduleOptions)
    if (!loaded) return
    const session = new loaded.binding.RenderSession(
      serializeMasterCSSManifest(options.manifest),
      options.emittedGlobals ? JSON.stringify(options.emittedGlobals) : undefined
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
      ensureClassRules: (classNames, nativeSupport) =>
        session.ensureClasses([...classNames], nativeSupport ? [...nativeSupport] : undefined),
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
