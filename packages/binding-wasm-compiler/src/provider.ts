import {
  createCompilerRenderSession,
  createCompilerWasmSession,
  initCompilerWasm
} from './index'

export type MasterCSSWasmCompilerInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module

export interface MasterCSSWasmCompilerLoadOptions {
  readonly module?: object
  readonly input?: MasterCSSWasmCompilerInput
}

interface MasterCSSCompilerWasmProviderSession {
  readonly info: unknown
  compareProjectSnapshots(request: unknown): unknown
  inspectCSS(source: string): unknown
  hasLocalStyleDirectives(source: string, from: string): boolean
  compileNativeCSS(source: string, options?: unknown): unknown
  compileCSSDirectives(source: string, options?: unknown): unknown
  analyzeCSSDependencies(source: string): unknown
  analyzeStandaloneDirectives(source: string): unknown
  mergeCSSExtractionPolicies(policies: unknown): unknown
  filterCSSExtractionCandidates(candidates: string[], blocklist: unknown): string[]
  compileManifestInput(input: unknown, options?: unknown): unknown
  lowerCSSDirectives(request: unknown, options?: unknown): unknown
  normalizeManifestForJSON(manifest: unknown): unknown
  normalizeDefaultManifestForJSON(manifest: unknown): unknown
  compileDefaultPresetManifest(request: unknown): unknown
  resolveCSSImportGraph(request: unknown): unknown
  resolveCSSStylesheetGraph(request: unknown): unknown
  prepareCSSStylesheetBundle(request: unknown): unknown
  renderCSSStylesheetBundle(request: unknown): unknown
  compileCSSStylesheetGraph(request: unknown): unknown
  readonly manifestStore?: {
    register(manifestJSON: string): { readonly key: string, json(): string | undefined }
    handle(key: string): { readonly key: string, json(): string | undefined }
    readonly retains: boolean
  }
}

interface MasterCSSCompilerWasmRenderProviderSession {
  nativeDeclarationCandidates(classNames: string[]): unknown
  ensureClasses(classNames: string[]): void
  ensureStylesheetResources(nativeCSS: string): void
  emittedGlobals(): unknown
  snapshot(): unknown
  dispose(): void
}

interface MasterCSSWasmGrammarProvider {
  cssGrammarVersion(): string
  cssSyntaxStatus(text: string): string
  cssValueStatus(property: string, value: string, atRule?: string): string
  cssRuleDeclarationsJSON(text: string): string
  validateCSSJSON(text: string): string
  parseCSSDeclarationsJSON(text: string): string
}

interface MasterCSSCompilerWasmProvider {
  readonly info: unknown
  readonly cssGrammar: MasterCSSWasmGrammarProvider
  createSession(): Promise<MasterCSSCompilerWasmProviderSession>
  createRenderSession(
    manifestJSON: string,
    emittedGlobalsJSON?: string
  ): Promise<MasterCSSCompilerWasmRenderProviderSession>
}

export async function createMasterCSSCompilerWasmProvider(
  options: MasterCSSWasmCompilerLoadOptions = {}
): Promise<object> {
  const module = await initCompilerWasm(options)
  const provider: MasterCSSCompilerWasmProvider = Object.freeze({
    info: module.bindingInfo(),
    cssGrammar: Object.freeze({
      cssGrammarVersion: () => module.cssGrammarVersion(),
      cssSyntaxStatus: (text: string) => module.cssSyntaxStatus(text),
      cssValueStatus: (property: string, value: string, atRule?: string) =>
        module.cssValueStatus(property, value, atRule),
      cssRuleDeclarationsJSON: (text: string) => module.cssRuleDeclarationsJSON(text),
      validateCSSJSON: (text: string) => module.validateCSSJSON(text),
      parseCSSDeclarationsJSON: (text: string) => module.parseCSSDeclarationsJSON(text)
    }),
    createSession: () => createCompilerWasmSession(options),
    createRenderSession: (manifestJSON, emittedGlobalsJSON) =>
      createCompilerRenderSession(manifestJSON, emittedGlobalsJSON, options)
  })
  return provider
}
