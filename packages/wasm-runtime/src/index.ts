import {
  MasterCSSError
} from '@master/css-schema'
import { assertMasterCSSBackendInfo } from '@master/css-backend'

export type MasterCSSWasmInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module

interface GeneratedEngineSession {
  manifestJSON(): string
  ensureClassRules(classNames: string[]): MasterCSSWasmEngineTransition
  deleteClassRules(classNames: string[]): MasterCSSWasmEngineTransition
  nativeDeclarationCandidates(classNames: string[]): unknown
  ensureClassRulesWithNativeSupport(classNames: string[], supported: Uint8Array): MasterCSSWasmEngineTransition
  refresh(manifestJSON: string): MasterCSSWasmEngineTransition
  snapshot(): MasterCSSWasmEngineSnapshot
  inspect(className: string): MasterCSSWasmEngineInspection
  dispose(): void
}

interface GeneratedRenderSession {
  nativeDeclarationCandidates(classNames: string[]): unknown
  ensureClasses(classNames: string[], supported?: Uint8Array): void
  ensureStylesheetResources(nativeCSS: string): void
  emittedGlobals(): unknown
  snapshot(): unknown
  snapshotForClasses(classNames: string[]): unknown
  dispose(): void
}

interface GeneratedWasmModule {
  default(input: { module_or_path: MasterCSSWasmInput }): Promise<WebAssembly.Exports>
  EngineSession: new (manifestJSON: string, emittedGlobalsJSON?: string) => GeneratedEngineSession
  RenderSession: new (manifestJSON: string, emittedGlobalsJSON?: string) => GeneratedRenderSession
  bindingInfo(): unknown
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

export interface MasterCSSWasmEngineInspection {
  readonly version: number
  readonly className: string
  readonly valid: boolean
  readonly rules: readonly unknown[]
}

interface NativeDeclarationCandidate {
  property: string
  value: string
}

const defaultWasmURL = new URL('../artifacts/mastercss_wasm_runtime_bg.wasm', import.meta.url)
const initializedInputs = new WeakMap<object, MasterCSSWasmInput>()
let defaultModulePromise: Promise<GeneratedWasmModule> | undefined

async function importGeneratedModule(): Promise<GeneratedWasmModule> {
  return await import('../artifacts/mastercss_wasm_runtime.js') as unknown as GeneratedWasmModule
}

function sameInput(left: MasterCSSWasmInput, right: MasterCSSWasmInput) {
  return left === right || String(left) === String(right)
}

async function initializeModule(module: GeneratedWasmModule, input: MasterCSSWasmInput) {
  const initializedInput = initializedInputs.get(module)
  if (initializedInput !== undefined) {
    if (!sameInput(initializedInput, input)) {
      throw new MasterCSSError({
        code: 'WASM_INPUT_CONFLICT',
        domain: 'backend',
        message: 'A Master CSS Wasm module cannot be initialized with two different inputs.'
      })
    }
    return module
  }
  await module.default({ module_or_path: input })
  assertMasterCSSBackendInfo(module.bindingInfo(), {
    surface: 'runtime',
    features: ['engine', 'render']
  })
  initializedInputs.set(module, input)
  return module
}

export async function loadWasmEngine(
  options: MasterCSSWasmEngineLoadOptions = {}
): Promise<object> {
  if (options.module) {
    return await initializeModule(
      options.module as GeneratedWasmModule,
      options.input ?? defaultWasmURL
    )
  }
  if (options.input !== undefined) {
    return await initializeModule(await importGeneratedModule(), options.input)
  }
  defaultModulePromise ??= importGeneratedModule()
    .then((module) => initializeModule(module, defaultWasmURL))
  return await defaultModulePromise
}

function nativeSupport(candidates: readonly NativeDeclarationCandidate[]) {
  return Uint8Array.from(candidates, ({ property, value }) => {
    try {
      return globalThis.CSS?.supports(property, value) === true ? 1 : 0
    } catch {
      return 0
    }
  })
}

function emittedGlobalsJSON(options: MasterCSSWasmEngineSessionOptions) {
  return options.emittedGlobals === undefined
    ? undefined
    : JSON.stringify(options.emittedGlobals)
}

export async function createWasmEngineSession(
  manifestJSON: string,
  sessionOptions: MasterCSSWasmEngineSessionOptions = {},
  loadOptions: MasterCSSWasmEngineLoadOptions = {}
) {
  const module = await loadWasmEngine(loadOptions) as GeneratedWasmModule
  const session = new module.EngineSession(manifestJSON, emittedGlobalsJSON(sessionOptions))
  let disposed = false
  const assertActive = () => {
    if (disposed) {
      throw new MasterCSSError({
        code: 'SESSION_DISPOSED',
        domain: 'backend',
        message: 'The Master CSS Wasm engine session has been disposed.'
      })
    }
  }
  return Object.freeze({
    manifestJSON() {
      assertActive()
      return session.manifestJSON()
    },
    ensureClassRules(classNames: string[]) {
      assertActive()
      const candidates = session.nativeDeclarationCandidates(classNames) as NativeDeclarationCandidate[]
      return candidates.length
        ? session.ensureClassRulesWithNativeSupport(classNames, nativeSupport(candidates))
        : session.ensureClassRules(classNames)
    },
    deleteClassRules(classNames: string[]) {
      assertActive()
      return session.deleteClassRules(classNames)
    },
    refresh(nextManifestJSON: string) {
      assertActive()
      return session.refresh(nextManifestJSON)
    },
    snapshot() {
      assertActive()
      return session.snapshot()
    },
    inspect(className: string) {
      assertActive()
      return session.inspect(className)
    },
    dispose() {
      if (disposed) return
      session.dispose()
      disposed = true
    }
  })
}

export async function createWasmRenderSession(
  manifestJSON: string,
  sessionOptions: MasterCSSWasmEngineSessionOptions = {},
  loadOptions: MasterCSSWasmEngineLoadOptions = {}
) {
  const module = await loadWasmEngine(loadOptions) as GeneratedWasmModule
  const session = new module.RenderSession(manifestJSON, emittedGlobalsJSON(sessionOptions))
  let disposed = false
  const assertActive = () => {
    if (disposed) {
      throw new MasterCSSError({
        code: 'SESSION_DISPOSED',
        domain: 'backend',
        message: 'The Master CSS Wasm render session has been disposed.'
      })
    }
  }
  return Object.freeze({
    ensureClassRules(classNames: readonly string[]) {
      assertActive()
      const classes = [...classNames]
      const candidates = session.nativeDeclarationCandidates(classes) as NativeDeclarationCandidate[]
      session.ensureClasses(classes, candidates.length ? nativeSupport(candidates) : undefined)
    },
    ensureStylesheetResources(nativeCSS: string) {
      assertActive()
      session.ensureStylesheetResources(nativeCSS)
    },
    emittedGlobals() {
      assertActive()
      return session.emittedGlobals()
    },
    snapshot() {
      assertActive()
      return session.snapshot()
    },
    snapshotForClassNames(classNames: readonly string[]) {
      assertActive()
      return session.snapshotForClasses([...classNames])
    },
    dispose() {
      if (disposed) return
      session.dispose()
      disposed = true
    }
  })
}
