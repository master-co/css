import { assertMasterCSSBackendInfo } from './binding'
import { bindCompilerBackendSession } from './broker-compiler-adapter'
import type {
  MasterCSSCompilerBackendSession,
  MasterCSSCompilerRenderBackendSession,
  MasterCSSWasmBackendLoadOptions
} from './broker-compiler-contract'
import type { MasterCSSBackendInfo } from './protocol'

type MasterCSSCompilerWasmProviderSession = Pick<
  MasterCSSCompilerBackendSession,
  | 'inspectCSS'
  | 'compileNativeCSS'
  | 'compileCSSDirectives'
  | 'compileThemeCSS'
  | 'analyzeCSSDependencies'
  | 'analyzeStandaloneDirectives'
  | 'mergeCSSExtractionPolicies'
  | 'filterCSSExtractionCandidates'
  | 'compileManifestInput'
  | 'lowerCSSDirectives'
  | 'compileDefaultPresetManifest'
  | 'resolveCSSImportGraph'
> & Readonly<{
  normalizeManifestForJSON: MasterCSSCompilerBackendSession['normalizeManifest']
  normalizeDefaultManifestForJSON: MasterCSSCompilerBackendSession['normalizeDefaultManifest']
}>

export interface MasterCSSCompilerWasmProviderContract {
  readonly info: MasterCSSBackendInfo
  createSession(): Promise<MasterCSSCompilerWasmProviderSession>
  createRenderSession(
    manifestJSON: string,
    emittedGlobalsJSON?: string
  ): Promise<Readonly<{
    nativeDeclarationCandidates: MasterCSSCompilerRenderBackendSession['nativeDeclarationCandidates']
    ensureClasses: MasterCSSCompilerRenderBackendSession['ensureClasses']
    ensureStylesheetResources: MasterCSSCompilerRenderBackendSession['ensureStylesheetResources']
    emittedGlobals: MasterCSSCompilerRenderBackendSession['emittedGlobals']
    snapshot: MasterCSSCompilerRenderBackendSession['snapshot']
    dispose(): void
  }>>
}

export type MasterCSSCompilerWasmProviderFactory = (
  options?: MasterCSSWasmBackendLoadOptions
) => Promise<object>

async function loadDefaultWasmProvider(options: MasterCSSWasmBackendLoadOptions | undefined) {
  const { createMasterCSSCompilerWasmProvider } = await import('@master/css-wasm-compiler')
  return await createMasterCSSCompilerWasmProvider(options)
}

async function provider(
  options: MasterCSSWasmBackendLoadOptions | undefined,
  factory: MasterCSSCompilerWasmProviderFactory = loadDefaultWasmProvider
) {
  const wasm = await factory(options) as MasterCSSCompilerWasmProviderContract
  assertMasterCSSBackendInfo(wasm.info, {
    surface: 'compiler',
    features: ['compiler', 'render']
  })
  return wasm
}

export async function createCompilerWasmBackendSession(
  options: MasterCSSWasmBackendLoadOptions | undefined,
  providerFactory?: MasterCSSCompilerWasmProviderFactory
): Promise<MasterCSSCompilerBackendSession> {
  const wasm = await provider(options, providerFactory)
  const session = await wasm.createSession()
  return bindCompilerBackendSession('wasm', {
    inspectCSS: (source) => session.inspectCSS(source),
    compileNativeCSS: (source, compileOptions) =>
      session.compileNativeCSS(source, compileOptions),
    compileCSSDirectives: (source, compileOptions) =>
      session.compileCSSDirectives(source, compileOptions),
    compileThemeCSS: (source, compileOptions) =>
      session.compileThemeCSS(source, compileOptions),
    analyzeCSSDependencies: (source) => session.analyzeCSSDependencies(source),
    analyzeStandaloneDirectives: (source) => session.analyzeStandaloneDirectives(source),
    mergeCSSExtractionPolicies: (policies) => session.mergeCSSExtractionPolicies(policies),
    filterCSSExtractionCandidates: (candidates, blocklist) =>
      session.filterCSSExtractionCandidates([...candidates], blocklist),
    compileManifestInput: (input, compileOptions) =>
      session.compileManifestInput(input, compileOptions),
    lowerCSSDirectives: (request, compileOptions) =>
      session.lowerCSSDirectives(request, compileOptions),
    normalizeManifest: (manifest) => session.normalizeManifestForJSON(manifest),
    normalizeDefaultManifest: (manifest) => session.normalizeDefaultManifestForJSON(manifest),
    compileDefaultPresetManifest: (request) => session.compileDefaultPresetManifest(request),
    resolveCSSImportGraph: (request) => session.resolveCSSImportGraph(request)
  })
}

export async function createCompilerWasmRenderBackendSession(
  manifestJSON: string,
  emittedGlobalsJSON: string | undefined,
  options: MasterCSSWasmBackendLoadOptions | undefined,
  providerFactory?: MasterCSSCompilerWasmProviderFactory
): Promise<MasterCSSCompilerRenderBackendSession> {
  const wasm = await provider(options, providerFactory)
  const session = await wasm.createRenderSession(manifestJSON, emittedGlobalsJSON)
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    session.dispose()
  }
  const bound: MasterCSSCompilerRenderBackendSession = {
    backend: 'wasm',
    nativeDeclarationCandidates: (classNames) =>
      session.nativeDeclarationCandidates([...classNames]),
    ensureClasses: (classNames, nativeSupport) =>
      session.ensureClasses([...classNames], nativeSupport ? [...nativeSupport] : undefined),
    ensureStylesheetResources: (nativeCSS) => session.ensureStylesheetResources(nativeCSS),
    emittedGlobals: () => session.emittedGlobals(),
    snapshot: () => session.snapshot(),
    dispose,
    [Symbol.dispose]: dispose
  }
  return Object.freeze(bound)
}
