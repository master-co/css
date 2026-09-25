import { MasterCSSError } from '@master/css-schema'

interface GeneratedToolingWasmModule {
  default(input: {
    module_or_path: RequestInfo | URL | Response | BufferSource | WebAssembly.Module
  }): Promise<WebAssembly.Exports>
  bindingInfo(): unknown
  extractClassCandidates(content: string): string[]
  extractOxcClasses(source: string, content: string): string[]
  extractHTMLClasses(source: string, content: string): string[]
  extractAstroClasses(source: string, content: string): string[]
  createInspectionReport(input: unknown): unknown
  ToolingLanguageSession: new (manifestJSON: string) => {
    prepareDocument(request: unknown): unknown
  finishDocument(id: number, nativeSupport: boolean[]): unknown
  cancelDocument(id: number): void
  analyzeDocument(request: unknown): unknown
    formatDirectives(request: unknown): unknown
    nativeDeclarationCandidates(classNames: string[]): unknown
    classifyClassNames(classNames: string[], nativeSupport: boolean[]): unknown
    inspectClassName(className: string, nativeSupport: boolean[], mode?: string): unknown
    completionIndex(): unknown
    colorPresentation(colorToken: string): unknown
    colorTokens(candidates: unknown[]): unknown
    dispose(): void
    free(): void
  }
  ToolingLexerSession: new () => {
    analyze(request: unknown): unknown
    dispose(): void
    free(): void
  }
  ToolingSourceSession: new () => {
    extract(request: unknown): unknown
    dispose(): void
    free(): void
  }
  ToolingScannerSession: new (manifestJSON: string) => {
    scan(source: string, content: string): unknown
    extractCandidates(source: string, content: string, options: unknown): string[]
    collectCandidates(candidates: string[]): string[]
    filterCandidates(candidates: string[], blocklist: unknown): string[]
    scanCandidates(source: string, content: string, candidates: string[], blocklist: unknown, options: unknown): unknown
    removeSource(source: string, options: unknown): unknown
    reconcileSources(owner: string, inputs: unknown): unknown
    removeOwner(owner: string): unknown
    ensureClasses(classNames: string[]): unknown
    registerNativeClasses(owner: string, classNames: string[]): boolean
    reset(): void
    state(): unknown
    dispose(): void
    free(): void
  }
  ToolingValidatorSession: new (manifestJSON: string) => {
    nativeDeclarationCandidates(classNames: string[]): unknown
    generateClasses(classNames: string[], nativeSupport?: boolean[]): unknown
    dispose(): void
    free(): void
  }
  ToolingLintSession: new (manifestJSON: string) => {
    nativeDeclarationCandidates(classNames: string[]): unknown
    resolveValidation(batch: unknown, ruleErrors: string[][][]): unknown
    canonicalClassNames(classNames: string[], nativeSupport: boolean[] | undefined, options: unknown): unknown
    canonicalClassGroups(classNames: string[], nativeSupport: boolean[] | undefined, options: unknown): unknown
    canonicalComposeDirective(classNames: string[], nativeSupport: boolean[] | undefined, options: unknown): unknown
    rawValueCandidates(
      classNames: string[],
      nativeSupport: boolean[] | undefined,
      invalidGeneratedClasses: string[]
    ): unknown
    analyze(classNames: string[], nativeSupport: boolean[] | undefined, invalidGeneratedClasses: string[]): unknown
    analyzeClassList(
      classList: string,
      classNames: string[],
      nativeSupport: boolean[] | undefined,
      invalidGeneratedClasses: string[]
    ): unknown
    analyzeClassListPolicy(requestJSON: string): unknown
    dispose(): void
    free(): void
  }
}

let modulePromise: Promise<GeneratedToolingWasmModule> | undefined
const initializedInputs = new WeakMap<object, NonNullable<InitToolingWasmOptions['input']>>()
const defaultWasmURL = new URL('../artifacts/mastercss_binding_wasm_tooling_bg.wasm', import.meta.url)

export interface InitToolingWasmOptions {
  module?: object
  input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module
}

function sameInput(
  left: NonNullable<InitToolingWasmOptions['input']>,
  right: NonNullable<InitToolingWasmOptions['input']>
) {
  return left === right || String(left) === String(right)
}

async function initializeModule(
  module: GeneratedToolingWasmModule,
  input: NonNullable<InitToolingWasmOptions['input']>
) {
  const initializedInput = initializedInputs.get(module)
  if (initializedInput !== undefined) {
    if (!sameInput(initializedInput, input)) {
      throw new MasterCSSError({
        code: 'WASM_INPUT_CONFLICT',
        domain: 'binding',
        message: 'A Master CSS tooling Wasm module cannot be initialized with two different inputs.'
      })
    }
    return module
  }
  await module.default({ module_or_path: input })
  initializedInputs.set(module, input)
  return module
}

async function importGeneratedModule(): Promise<GeneratedToolingWasmModule> {
  return await import('../artifacts/mastercss_binding_wasm_tooling.js') as unknown as GeneratedToolingWasmModule
}

export async function initToolingWasm(options: InitToolingWasmOptions = {}) {
  try {
    if (options.module) {
      const module = options.module as GeneratedToolingWasmModule
      return await initializeModule(module, options.input || defaultWasmURL)
    }
    if (options.input !== undefined) {
      return await initializeModule(await importGeneratedModule(), options.input)
    }
    modulePromise ??= importGeneratedModule()
      .then((module) => initializeModule(module, defaultWasmURL))
      .catch((cause) => {
        modulePromise = undefined
        throw cause
      })
    return await modulePromise
  } catch (cause) {
    if (cause instanceof MasterCSSError) throw cause
    throw new MasterCSSError({
      code: 'WASM_LOAD_FAILED',
      domain: 'binding',
      message: cause instanceof Error
        ? cause.message
        : 'Cannot load the Master CSS tooling Wasm artifact.'
    }, { cause })
  }
}

export async function createToolingScannerSession(
  manifestJSON: string,
  options: InitToolingWasmOptions = {}
) {
  const module = await initToolingWasm(options)
  const session = new module.ToolingScannerSession(manifestJSON)
  return {
    scan: (source: string, content: string) => session.scan(source, content),
    extractCandidates: (source: string, content: string, options: unknown = {}) => session.extractCandidates(source, content, options),
    collectCandidates: (candidates: string[]) => session.collectCandidates(candidates),
    filterCandidates: (candidates: string[], blocklist: unknown) => session.filterCandidates(candidates, blocklist),
    scanCandidates: (source: string, content: string, candidates: string[], blocklist: unknown, options: unknown = {}) => session.scanCandidates(source, content, candidates, blocklist, options),
    removeSource: (source: string, options: unknown = {}) => session.removeSource(source, options),
    reconcileSources: (owner: string, inputs: unknown) => session.reconcileSources(owner, inputs),
    removeOwner: (owner: string) => session.removeOwner(owner),
    ensureClasses: (classNames: string[]) => session.ensureClasses(classNames),
    registerNativeClasses: (owner: string, classNames: string[]) => session.registerNativeClasses(owner, classNames),
    reset: () => session.reset(),
    state: () => session.state(),
    dispose() {
      session.dispose()
      session.free()
    }
  }
}

export async function createToolingValidatorSession(
  manifestJSON: string,
  options: InitToolingWasmOptions = {}
) {
  const module = await initToolingWasm(options)
  const session = new module.ToolingValidatorSession(manifestJSON)
  return {
    nativeDeclarationCandidates: (classNames: string[]) => session.nativeDeclarationCandidates(classNames),
    generateClasses: (classNames: string[], nativeSupport?: boolean[]) => session.generateClasses(classNames, nativeSupport),
    dispose() {
      session.dispose()
      session.free()
    }
  }
}

export async function createToolingInspectionReport(
  input: unknown,
  options: InitToolingWasmOptions = {}
) {
  const module = await initToolingWasm(options)
  return module.createInspectionReport(input)
}

export async function createToolingLanguageSession(
  manifestJSON: string,
  options: InitToolingWasmOptions = {}
) {
  const module = await initToolingWasm(options)
  const session = new module.ToolingLanguageSession(manifestJSON)
  return {
    prepareDocument: (request: unknown) => session.prepareDocument(request),
    finishDocument: (id: number, support: boolean[]) => session.finishDocument(id, support),
    cancelDocument: (id: number) => session.cancelDocument(id),
    analyzeDocument: (request: unknown) => session.analyzeDocument(request),
    formatDirectives: (request: unknown) => session.formatDirectives(request),
    nativeDeclarationCandidates: (classNames: string[]) => session.nativeDeclarationCandidates(classNames),
    classifyClassNames: (classNames: string[], nativeSupport?: boolean[]) =>
      session.classifyClassNames(classNames, nativeSupport || []),
    inspectClassName: (className: string, nativeSupport?: boolean[], mode?: string) =>
      session.inspectClassName(className, nativeSupport || [], mode),
    completionIndex: () => session.completionIndex(),
    colorPresentation: (colorToken: string) => session.colorPresentation(colorToken),
    colorTokens: (candidates: unknown[]) => session.colorTokens(candidates),
    dispose() {
      session.dispose()
      session.free()
    }
  }
}

export async function createToolingLintSession(
  manifestJSON: string,
  options: InitToolingWasmOptions = {}
) {
  const module = await initToolingWasm(options)
  const session = new module.ToolingLintSession(manifestJSON)
  return {
    nativeDeclarationCandidates: (classNames: string[]) => session.nativeDeclarationCandidates(classNames),
    resolveValidation: (batch: unknown, ruleErrors: string[][][]) => session.resolveValidation(batch, ruleErrors),
    canonicalClassNames: (
      classNames: string[],
      nativeSupport: boolean[] | undefined,
      options?: unknown
    ) => session.canonicalClassNames(classNames, nativeSupport, options),
    canonicalClassGroups: (
      classNames: string[],
      nativeSupport: boolean[] | undefined,
      options?: unknown
    ) => session.canonicalClassGroups(classNames, nativeSupport, options),
    canonicalComposeDirective: (
      classNames: string[],
      nativeSupport: boolean[] | undefined,
      options?: unknown
    ) => session.canonicalComposeDirective(classNames, nativeSupport, options),
    rawValueCandidates: (
      classNames: string[],
      nativeSupport: boolean[] | undefined,
      invalidGeneratedClasses: string[]
    ) => session.rawValueCandidates(classNames, nativeSupport, invalidGeneratedClasses),
    analyze: (classNames: string[], nativeSupport: boolean[] | undefined, invalidGeneratedClasses: string[]) =>
      session.analyze(classNames, nativeSupport, invalidGeneratedClasses),
    analyzeClassList: (
      classList: string,
      classNames: string[],
      nativeSupport: boolean[] | undefined,
      invalidGeneratedClasses: string[]
    ) => session.analyzeClassList(classList, classNames, nativeSupport, invalidGeneratedClasses),
    analyzeClassListPolicy: (requestJSON: string) => session.analyzeClassListPolicy(requestJSON),
    dispose() {
      session.dispose()
      session.free()
    }
  }
}
