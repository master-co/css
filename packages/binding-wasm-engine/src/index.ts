import {
  MasterCSSError
} from '@master/css-schema'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSKeyframeDefinition } from '@master/css-schema/manifest'

export type MasterCSSWasmInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module

/**
 * Emitted globals as the engine Wasm takes them: the variable, keyframe, keyframe
 * slot and suppressed keyframe names in that order, then the variable, keyframe and
 * slot totals followed by each variable's and each keyframe's count.
 */
type GeneratedEmittedGlobals = [names: string[], counts: Uint32Array]

// The browser runtime artifact is built without the binding's `full` feature,
// so manifest compilation, render sessions and inspection exports are absent
// from its module. Sessions execute compiled runtime programs, and results cross
// the boundary as JSON text.
interface GeneratedEngineSession {
  manifestJSON?(): string
  ensureClassRules(classNames: string[]): string
  deleteClassRules(classNames: string[]): string
  registerEmittedGlobals(...emittedGlobals: GeneratedEmittedGlobals): string
  replaceEmittedGlobals(...emittedGlobals: GeneratedEmittedGlobals): string
  nativeDeclarationCandidates?(classNames: string[]): string
  refresh(program: Uint8Array, ...emittedGlobals: GeneratedEmittedGlobals | []): string
  refreshManifest?(manifestJSON: string, emittedGlobalsJSON?: string): string
  keyframeDefinitions(): string
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
  EngineSession: {
    new (program: Uint8Array, ...emittedGlobals: GeneratedEmittedGlobals): GeneratedEngineSession
    fromManifest?(manifestJSON: string, emittedGlobalsJSON?: string): GeneratedEngineSession
  }
  RenderSession?: new (manifestJSON: string, emittedGlobalsJSON?: string) => GeneratedRenderSession
  compileRuntimeProgram?(manifestJSON: string): Uint8Array
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
  emittedGlobals?: MasterCSSEmittedGlobals
}

/**
 * What an engine session executes: a compiled runtime program, or manifest JSON,
 * which only the `full` artifact compiles.
 */
export type MasterCSSWasmEngineSource = Uint8Array | string

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
      source: MasterCSSWasmEngineSource,
      sessionOptions: MasterCSSWasmEngineSessionOptions = {},
      loadOptions: MasterCSSWasmEngineLoadOptions = {}
    ) {
      return engineSession(
        await loadWasmEngine(loadOptions) as GeneratedWasmModule,
        source,
        sessionOptions
      )
    },
    async compileRuntimeProgram(
      manifestJSON: string,
      loadOptions: MasterCSSWasmEngineLoadOptions = {}
    ) {
      const module = await loadWasmEngine(loadOptions) as GeneratedWasmModule
      assertExport(module.compileRuntimeProgram, 'compileRuntimeProgram()')
      return module.compileRuntimeProgram(manifestJSON)
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

const EMITTED_GLOBALS_FIELDS = new Set(['variables', 'keyframes', 'keyframeSlots', 'suppressedKeyframes'])

function invalidEmittedGlobals(message: string): never {
  throw new MasterCSSError({
    code: 'INVALID_INPUT',
    domain: 'binding',
    message: `Invalid Master CSS emitted globals: ${message}`
  })
}

function counted(field: string, record: Record<string, number> | undefined) {
  const entries = Object.entries(record ?? {})
  for (const [name, count] of entries) {
    if (!Number.isInteger(count) || count < 0 || count > 0xffffffff) {
      invalidEmittedGlobals(`${field}.${name} must be a count.`)
    }
  }
  return entries
}

/** Validates what the engine's emitted globals schema accepts, then flattens it. */
function generatedEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals = {}): GeneratedEmittedGlobals {
  for (const field of Object.keys(emittedGlobals)) {
    if (!EMITTED_GLOBALS_FIELDS.has(field)) invalidEmittedGlobals(`unknown field ${field}.`)
  }
  const variables = counted('variables', emittedGlobals.variables)
  const keyframes = counted('keyframes', emittedGlobals.keyframes)
  const slots = emittedGlobals.keyframeSlots ?? []
  const entries = [...variables, ...keyframes]
  return [
    entries.map(([name]) => name).concat(slots, emittedGlobals.suppressedKeyframes ?? []),
    Uint32Array.from([variables.length, keyframes.length, slots.length, ...entries.map(([, count]) => count)])
  ]
}

function createGeneratedEngineSession(
  module: GeneratedWasmModule,
  source: MasterCSSWasmEngineSource,
  sessionOptions: MasterCSSWasmEngineSessionOptions
) {
  if (typeof source !== 'string') {
    return new module.EngineSession(source, ...generatedEmittedGlobals(sessionOptions.emittedGlobals))
  }
  assertExport(module.EngineSession.fromManifest, 'manifest compilation')
  return module.EngineSession.fromManifest(source, emittedGlobalsJSON(sessionOptions))
}

function engineSession(
  module: GeneratedWasmModule,
  source: MasterCSSWasmEngineSource,
  sessionOptions: MasterCSSWasmEngineSessionOptions
) {
  const session = createGeneratedEngineSession(module, source, sessionOptions)
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
    registerEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals) {
      assertActive()
      return JSON.parse(session.registerEmittedGlobals(
        ...generatedEmittedGlobals(emittedGlobals)
      )) as MasterCSSWasmEngineTransition
    },
    replaceEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals) {
      assertActive()
      return JSON.parse(session.replaceEmittedGlobals(
        ...generatedEmittedGlobals(emittedGlobals)
      )) as MasterCSSWasmEngineTransition
    },
    refresh(next: MasterCSSWasmEngineSource, emittedGlobals?: MasterCSSEmittedGlobals) {
      assertActive()
      if (typeof next === 'string') {
        assertExport(session.refreshManifest, 'manifest compilation')
        return JSON.parse(session.refreshManifest(
          next,
          emittedGlobals === undefined ? undefined : JSON.stringify(emittedGlobals)
        )) as MasterCSSWasmEngineTransition
      }
      return JSON.parse(session.refresh(
        next,
        ...emittedGlobals === undefined ? [] as [] : generatedEmittedGlobals(emittedGlobals)
      )) as MasterCSSWasmEngineTransition
    },
    keyframeDefinitions() {
      assertActive()
      return JSON.parse(session.keyframeDefinitions()) as readonly MasterCSSKeyframeDefinition[]
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
