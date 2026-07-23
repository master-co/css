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
  inspectCSS(source: string): unknown
  compileNativeCSS(source: string, options?: unknown): unknown
  compileCSSDirectives(source: string, options?: unknown): unknown
  compileThemeCSS(source: string, options?: unknown): unknown
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
}

interface MasterCSSCompilerWasmRenderProviderSession {
  nativeDeclarationCandidates(classNames: string[]): unknown
  ensureClasses(classNames: string[], nativeSupport?: boolean[]): void
  ensureStylesheetResources(nativeCSS: string): void
  emittedGlobals(): unknown
  snapshot(): unknown
  dispose(): void
}

interface MasterCSSCompilerWasmProvider {
  readonly info: unknown
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
    createSession: () => createCompilerWasmSession(options),
    createRenderSession: (manifestJSON, emittedGlobalsJSON) =>
      createCompilerRenderSession(manifestJSON, emittedGlobalsJSON, options)
  })
  return provider
}
