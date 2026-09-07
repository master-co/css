import { assertMasterCSSBindingInfo } from './binding'
import { bindCompilerBindingSession } from './compiler-binding-adapter'
import type {
  MasterCSSCompilerBindingSession,
  MasterCSSCompilerRenderBindingSession,
  MasterCSSWasmBindingLoadOptions
} from './compiler-binding-contract'
import type { MasterCSSBindingInfo } from './protocol'

type MasterCSSCompilerWasmProviderSession = Pick<
  MasterCSSCompilerBindingSession,
  | 'inspectCSS'
  | 'compileNativeCSS'
  | 'compileCSSDirectives'
  | 'analyzeCSSDependencies'
  | 'analyzeStandaloneDirectives'
  | 'mergeCSSExtractionPolicies'
  | 'filterCSSExtractionCandidates'
  | 'compileManifestInput'
  | 'lowerCSSDirectives'
  | 'compileDefaultPresetManifest'
  | 'resolveCSSImportGraph'
> & Readonly<{
  normalizeManifestForJSON: MasterCSSCompilerBindingSession['normalizeManifest']
  normalizeDefaultManifestForJSON: MasterCSSCompilerBindingSession['normalizeDefaultManifest']
}>

export interface MasterCSSCompilerWasmProviderContract {
  readonly info: MasterCSSBindingInfo
  createSession(): Promise<MasterCSSCompilerWasmProviderSession>
  createRenderSession(
    manifestJSON: string,
    emittedGlobalsJSON?: string
  ): Promise<Readonly<{
    nativeDeclarationCandidates: MasterCSSCompilerRenderBindingSession['nativeDeclarationCandidates']
    ensureClasses: MasterCSSCompilerRenderBindingSession['ensureClasses']
    ensureStylesheetResources: MasterCSSCompilerRenderBindingSession['ensureStylesheetResources']
    emittedGlobals: MasterCSSCompilerRenderBindingSession['emittedGlobals']
    snapshot: MasterCSSCompilerRenderBindingSession['snapshot']
    dispose(): void
  }>>
}

export type MasterCSSCompilerWasmProviderFactory = (
  options?: MasterCSSWasmBindingLoadOptions
) => Promise<object>

async function loadDefaultWasmProvider(options: MasterCSSWasmBindingLoadOptions | undefined) {
  const { createMasterCSSCompilerWasmProvider } = await import('@master/css-binding-wasm-compiler')
  return await createMasterCSSCompilerWasmProvider(options)
}

async function provider(
  options: MasterCSSWasmBindingLoadOptions | undefined,
  factory: MasterCSSCompilerWasmProviderFactory = loadDefaultWasmProvider
) {
  const wasm = await factory(options) as MasterCSSCompilerWasmProviderContract
  assertMasterCSSBindingInfo(wasm.info, {
    surface: 'compiler',
    features: ['compiler', 'render']
  })
  return wasm
}

export async function createCompilerWasmBindingSession(
  options: MasterCSSWasmBindingLoadOptions | undefined,
  providerFactory?: MasterCSSCompilerWasmProviderFactory
): Promise<MasterCSSCompilerBindingSession> {
  const wasm = await provider(options, providerFactory)
  const session = await wasm.createSession()
  return bindCompilerBindingSession('wasm', {
    inspectCSS: (source) => session.inspectCSS(source),
    compileNativeCSS: (source, compileOptions) =>
      session.compileNativeCSS(source, compileOptions),
    compileCSSDirectives: (source, compileOptions) =>
      session.compileCSSDirectives(source, compileOptions),
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

export async function createCompilerWasmRenderBindingSession(
  manifestJSON: string,
  emittedGlobalsJSON: string | undefined,
  options: MasterCSSWasmBindingLoadOptions | undefined,
  providerFactory?: MasterCSSCompilerWasmProviderFactory
): Promise<MasterCSSCompilerRenderBindingSession> {
  const wasm = await provider(options, providerFactory)
  const session = await wasm.createRenderSession(manifestJSON, emittedGlobalsJSON)
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    session.dispose()
  }
  const bound: MasterCSSCompilerRenderBindingSession = {
    binding: 'wasm',
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
