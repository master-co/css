import {
  createToolingInspectionReport,
  createToolingLanguageSession,
  createToolingLintSession,
  createToolingScannerSession,
  createToolingValidatorSession,
  initToolingWasm
} from './index'

export type MasterCSSWasmToolingInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module

export interface MasterCSSWasmToolingLoadOptions {
  readonly module?: object
  readonly input?: MasterCSSWasmToolingInput
}

interface MasterCSSToolingWasmScannerProviderSession {
  scan(source: string, content: string): unknown
  extractCandidates(source: string, content: string): string[]
  nativeDeclarationCandidates(candidates: string[]): unknown
  collectCandidates(candidates: string[]): string[]
  filterCandidates(candidates: string[], blocklist: unknown): string[]
  invalidGeneratedClasses(batch: unknown, ruleSupport: boolean[][]): string[]
  scanCandidates(
    source: string,
    content: string,
    candidates: string[],
    blocklist: unknown,
    nativeSupport: boolean[],
    invalidGeneratedClasses: string[]
  ): unknown
  ensureClasses(classNames: string[]): unknown
  registerNativeClasses(classNames: string[]): boolean
  reset(): void
  state(): unknown
  dispose(): void
}

interface MasterCSSToolingWasmValidatorProviderSession {
  nativeDeclarationCandidates(classNames: string[]): unknown
  generateClasses(classNames: string[], nativeSupport?: boolean[]): unknown
  dispose(): void
}

interface MasterCSSToolingWasmLanguageProviderSession {
  analyzeDocument(request: unknown): unknown
  formatDirectives(request: unknown): unknown
  nativeDeclarationCandidates(classNames: string[]): unknown
  classifyClassNames(classNames: string[], nativeSupport?: boolean[]): unknown
  inspectClassName(className: string, nativeSupport?: boolean[], mode?: string): unknown
  completionIndex(): unknown
  colorPresentation(colorToken: string): unknown
  colorTokens(candidates: unknown[]): unknown
  dispose(): void
}

interface MasterCSSToolingWasmLintProviderSession {
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
  analyze(
    classNames: string[],
    nativeSupport: boolean[] | undefined,
    invalidGeneratedClasses: string[]
  ): unknown
  analyzeClassList(
    classList: string,
    classNames: string[],
    nativeSupport: boolean[] | undefined,
    invalidGeneratedClasses: string[]
  ): unknown
  analyzeClassListPolicy(requestJSON: string): unknown
  dispose(): void
}

interface MasterCSSToolingWasmProvider {
  readonly info: unknown
  createLexerSession(): Promise<Readonly<{
    analyze(request: unknown): unknown
    dispose(): void
  }>>
  createSourceSession(): Promise<Readonly<{
    extract(request: unknown): unknown
    dispose(): void
  }>>
  createScannerSession(
    manifestJSON: string
  ): Promise<MasterCSSToolingWasmScannerProviderSession>
  createValidatorSession(
    manifestJSON: string
  ): Promise<MasterCSSToolingWasmValidatorProviderSession>
  createLanguageSession(
    manifestJSON: string
  ): Promise<MasterCSSToolingWasmLanguageProviderSession>
  createLintSession(
    manifestJSON: string
  ): Promise<MasterCSSToolingWasmLintProviderSession>
  createInspectionReport(input: unknown): Promise<unknown>
  extractClassCandidates(content: string): readonly string[]
  extractOxcClasses(source: string, content: string): readonly string[]
  extractHTMLClasses(source: string, content: string): readonly string[]
  extractAstroClasses(source: string, content: string): readonly string[]
}

export async function createMasterCSSToolingWasmProvider(
  options: MasterCSSWasmToolingLoadOptions = {}
): Promise<object> {
  const module = await initToolingWasm(options)
  const provider: MasterCSSToolingWasmProvider = Object.freeze({
    info: module.bindingInfo(),
    async createLexerSession() {
      const session = new module.ToolingLexerSession()
      let disposed = false
      return Object.freeze({
        analyze: (request: unknown) => session.analyze(request),
        dispose() {
          if (disposed) return
          disposed = true
          session.dispose()
          session.free()
        }
      })
    },
    async createSourceSession() {
      const session = new module.ToolingSourceSession()
      let disposed = false
      return Object.freeze({
        extract: (request: unknown) => session.extract(request),
        dispose() {
          if (disposed) return
          disposed = true
          session.dispose()
          session.free()
        }
      })
    },
    createScannerSession: (manifestJSON) =>
      createToolingScannerSession(manifestJSON, options),
    createValidatorSession: (manifestJSON) =>
      createToolingValidatorSession(manifestJSON, options),
    createLanguageSession: (manifestJSON) =>
      createToolingLanguageSession(manifestJSON, options),
    createLintSession: (manifestJSON) =>
      createToolingLintSession(manifestJSON, options),
    createInspectionReport: (input) => createToolingInspectionReport(input, options),
    extractClassCandidates: (content) => module.extractClassCandidates(content),
    extractOxcClasses: (source, content) => module.extractOxcClasses(source, content),
    extractHTMLClasses: (source, content) => module.extractHTMLClasses(source, content),
    extractAstroClasses: (source, content) => module.extractAstroClasses(source, content)
  })
  return provider
}
