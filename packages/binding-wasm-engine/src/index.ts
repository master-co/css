import {
  MasterCSSError
} from '@master/css-schema'

export type MasterCSSWasmInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module

// The browser runtime artifact is built without the binding's `full` feature,
// so render sessions and inspection exports are absent from its module. Results
// cross the boundary as JSON text.
interface GeneratedEngineSession {
  manifestJSON?(): string
  ensureClassRules(classNames: string[]): string
  deleteClassRules(classNames: string[]): string
  registerEmittedGlobals(emittedGlobalsJSON: string): string
  replaceEmittedGlobals(emittedGlobalsJSON: string): string
  nativeDeclarationCandidates?(classNames: string[]): string
  refresh(manifestJSON: string, emittedGlobalsJSON?: string): string
  snapshot(): string
  executionState(classNames: string[]): string
  inspect?(className: string): string
  dispose(): void
}

interface GeneratedRenderSession {
  nativeDeclarationCandidates(classNames: string[]): string
  ensureClasses(classNames: string[], supported?: readonly boolean[]): void
  ensureStylesheetResources(nativeCSS: string): void
  emittedGlobals(): string
  snapshot(): string
  snapshotForClasses(classNames: string[]): string
  dispose(): void
}

interface GeneratedWasmModule {
  default(input: { module_or_path: MasterCSSWasmInput }): Promise<WebAssembly.Exports>
  EngineSession: new (manifestJSON: string, emittedGlobalsJSON?: string) => GeneratedEngineSession
  RenderSession?: new (manifestJSON: string, emittedGlobalsJSON?: string) => GeneratedRenderSession
  bindingInfo(): string
}

export interface MasterCSSWasmEngineLoadOptions {
  /**
   * Advanced host injection. The object must be a generated Master CSS engine
   * Wasm module; generated symbols are intentionally not part of the public API.
   */
  module?: object
  input?: MasterCSSWasmInput
}

export interface MasterCSSWasmEngineSessionOptions {
  emittedGlobals?: unknown
}

export interface MasterCSSWasmEngineTransition {
  readonly version: number
  readonly mutations: readonly unknown[]
}

export interface MasterCSSWasmEngineSnapshot {
  readonly version: number
  readonly rules: readonly unknown[]
  readonly resources: unknown
  readonly text: string
}

export interface MasterCSSWasmEngineExecutionState {
  readonly classes: readonly unknown[]
  readonly resources: unknown
}

export interface MasterCSSWasmEngineInspection {
  readonly version: number
  readonly className: string
  readonly valid: boolean
  readonly rules: readonly unknown[]
}

export interface MasterCSSWasmNativeDeclarationCandidate {
  property: string
  value: string
}

/** The generated bindings and Wasm binary an entry point loads by default. */
export interface MasterCSSWasmEngineArtifact {
  readonly url: URL
  load(): Promise<object>
}

const initializedInputs = new WeakMap<object, MasterCSSWasmInput>()

function sameInput(left: MasterCSSWasmInput, right: MasterCSSWasmInput) {
  return left === right || String(left) === String(right)
}

async function initializeModule(module: GeneratedWasmModule, input: MasterCSSWasmInput) {
  const initializedInput = initializedInputs.get(module)
  if (initializedInput !== undefined) {
    if (!sameInput(initializedInput, input)) {
      throw new MasterCSSError({
        code: 'WASM_INPUT_CONFLICT',
        domain: 'binding',
        message: 'A Master CSS Wasm module cannot be initialized with two different inputs.'
      })
    }
    return module
  }
  await module.default({ module_or_path: input })
  initializedInputs.set(module, input)
  return module
}

/**
 * Binds the loading and session APIs to one artifact. Entry points own the artifact
 * paths, so a bundler only sees the Wasm its entry can load.
 */
export function createWasmEngineLoader(artifact: MasterCSSWasmEngineArtifact) {
  let defaultModulePromise: Promise<GeneratedWasmModule> | undefined
  const importGeneratedModule = async () => await artifact.load() as GeneratedWasmModule

  async function loadWasmEngine(
    options: MasterCSSWasmEngineLoadOptions = {}
  ): Promise<object> {
    try {
      if (options.module) {
        return await initializeModule(
          options.module as GeneratedWasmModule,
          options.input ?? artifact.url
        )
      }
      if (options.input !== undefined) {
        return await initializeModule(await importGeneratedModule(), options.input)
      }
      defaultModulePromise ??= importGeneratedModule()
        .then((module) => initializeModule(module, artifact.url))
        .catch((cause) => {
          defaultModulePromise = undefined
          throw cause
        })
      return await defaultModulePromise
    } catch (cause) {
      if (cause instanceof MasterCSSError) throw cause
      throw new MasterCSSError({
        code: 'WASM_LOAD_FAILED',
        domain: 'binding',
        message: cause instanceof Error
          ? cause.message
          : 'Cannot load the Master CSS engine Wasm artifact.'
      }, { cause })
    }
  }

  return Object.freeze({
    url: artifact.url,
    loadWasmEngine,
    async createWasmEngineSession(
      manifestJSON: string,
      sessionOptions: MasterCSSWasmEngineSessionOptions = {},
      loadOptions: MasterCSSWasmEngineLoadOptions = {}
    ) {
      return engineSession(
        await loadWasmEngine(loadOptions) as GeneratedWasmModule,
        manifestJSON,
        sessionOptions
      )
    },
    async createWasmRenderSession(
      manifestJSON: string,
      sessionOptions: MasterCSSWasmEngineSessionOptions = {},
      loadOptions: MasterCSSWasmEngineLoadOptions = {}
    ) {
      return renderSession(
        await loadWasmEngine(loadOptions) as GeneratedWasmModule,
        manifestJSON,
        sessionOptions
      )
    }
  })
}

export type MasterCSSWasmEngineLoader = ReturnType<typeof createWasmEngineLoader>

function assertExport<T>(value: T | undefined, name: string): asserts value is T {
  if (value !== undefined) return
  throw new MasterCSSError({
    code: 'WASM_FEATURE_UNAVAILABLE',
    domain: 'binding',
    message: `This Master CSS engine Wasm artifact does not include ${name}.`
  })
}

function emittedGlobalsJSON(options: MasterCSSWasmEngineSessionOptions) {
  return options.emittedGlobals === undefined
    ? undefined
    : JSON.stringify(options.emittedGlobals)
}

function engineSession(
  module: GeneratedWasmModule,
  manifestJSON: string,
  sessionOptions: MasterCSSWasmEngineSessionOptions
) {
  const session = new module.EngineSession(manifestJSON, emittedGlobalsJSON(sessionOptions))
  let disposed = false
  const assertActive = () => {
    if (disposed) {
      throw new MasterCSSError({
        code: 'SESSION_DISPOSED',
        domain: 'binding',
        message: 'The Master CSS Wasm engine session has been disposed.'
      })
    }
  }
  return Object.freeze({
    manifestJSON() {
      assertActive()
      assertExport(session.manifestJSON, 'manifestJSON()')
      return session.manifestJSON()
    },
    ensureClassRules(classNames: string[]) {
      assertActive()
      return JSON.parse(session.ensureClassRules(classNames)) as MasterCSSWasmEngineTransition
    },
    deleteClassRules(classNames: string[]) {
      assertActive()
      return JSON.parse(session.deleteClassRules(classNames)) as MasterCSSWasmEngineTransition
    },
    registerEmittedGlobals(emittedGlobals: unknown) {
      assertActive()
      return JSON.parse(session.registerEmittedGlobals(
        typeof emittedGlobals === 'string'
          ? emittedGlobals
          : JSON.stringify(emittedGlobals)
      )) as MasterCSSWasmEngineTransition
    },
    replaceEmittedGlobals(emittedGlobals: unknown) {
      assertActive()
      return JSON.parse(session.replaceEmittedGlobals(
        typeof emittedGlobals === 'string'
          ? emittedGlobals
          : JSON.stringify(emittedGlobals)
      )) as MasterCSSWasmEngineTransition
    },
    refresh(nextManifestJSON: string, emittedGlobalsJSON?: string) {
      assertActive()
      return JSON.parse(session.refresh(nextManifestJSON, emittedGlobalsJSON)) as MasterCSSWasmEngineTransition
    },
    snapshot() {
      assertActive()
      return JSON.parse(session.snapshot()) as MasterCSSWasmEngineSnapshot
    },
    executionState(classNames: string[]) {
      assertActive()
      return JSON.parse(session.executionState(classNames)) as MasterCSSWasmEngineExecutionState
    },
    inspect(className: string) {
      assertActive()
      assertExport(session.inspect, 'inspect()')
      return JSON.parse(session.inspect(className)) as MasterCSSWasmEngineInspection
    },
    dispose() {
      if (disposed) return
      session.dispose()
      disposed = true
    }
  })
}

function renderSession(
  module: GeneratedWasmModule,
  manifestJSON: string,
  sessionOptions: MasterCSSWasmEngineSessionOptions
) {
  assertExport(module.RenderSession, 'RenderSession')
  const session = new module.RenderSession(manifestJSON, emittedGlobalsJSON(sessionOptions))
  let disposed = false
  const assertActive = () => {
    if (disposed) {
      throw new MasterCSSError({
        code: 'SESSION_DISPOSED',
        domain: 'binding',
        message: 'The Master CSS Wasm render session has been disposed.'
      })
    }
  }
  return Object.freeze({
    nativeDeclarationCandidates(classNames: readonly string[]) {
      assertActive()
      return JSON.parse(session.nativeDeclarationCandidates([...classNames])) as readonly MasterCSSWasmNativeDeclarationCandidate[]
    },
    ensureClassRules(classNames: readonly string[]) {
      assertActive()
      session.ensureClasses([...classNames])
    },
    ensureStylesheetResources(nativeCSS: string) {
      assertActive()
      session.ensureStylesheetResources(nativeCSS)
    },
    emittedGlobals() {
      assertActive()
      return JSON.parse(session.emittedGlobals()) as unknown
    },
    snapshot() {
      assertActive()
      return JSON.parse(session.snapshot()) as unknown
    },
    snapshotForClassNames(classNames: readonly string[]) {
      assertActive()
      return JSON.parse(session.snapshotForClasses([...classNames])) as unknown
    },
    dispose() {
      if (disposed) return
      session.dispose()
      disposed = true
    }
  })
}
