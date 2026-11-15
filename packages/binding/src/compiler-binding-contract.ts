import type {
  MasterCSSBindingLoadOptions,
  MasterCSSNativeBindingLoadOptions,
  MasterCSSWasmBindingLoadOptions
} from './binding-options'
import type {
  MasterCSSCompileDefaultPresetRequest,
  MasterCSSCompileDefaultPresetResult,
  MasterCSSPrepareStylesheetBundleRequest,
  MasterCSSStylesheetBundle,
  MasterCSSRenderStylesheetBundleRequest,
  MasterCSSStylesheetAsset,
  MasterCSSCompileStylesheetGraphRequest,
  MasterCSSCompiledStylesheetGraph,
  MasterCSSCompileManifestOptions,
  MasterCSSCompileManifestResult,
  MasterCSSCompilerInspection,
  MasterCSSDependencyAnalysis,
  MasterCSSDiagnosticsReportInput,
  MasterCSSDirectiveCompilation,
  MasterCSSDirectiveCompileOptions,
  MasterCSSDirectiveExtractionPolicy,
  MasterCSSDirectiveManifestInput,
  MasterCSSInspectionReport,
  MasterCSSLowerDirectivesOptions,
  MasterCSSLowerDirectivesRequest,
  MasterCSSLowerDirectivesResult,
  MasterCSSNativeDeclarationCandidate,
  MasterCSSProjectEntryGraph,
  MasterCSSProjectManifest,
  MasterCSSRegex,
  MasterCSSResolvedBinding,
  MasterCSSImportGraphRequest,
  MasterCSSResolvedImportGraph,
  MasterCSSServerRender,
  MasterCSSStandaloneDirectiveAnalysis
} from './protocol'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

export type {
  MasterCSSBindingLoadOptions,
  MasterCSSNativeBindingLoadOptions,
  MasterCSSWasmBindingLoadOptions
} from './binding-options'

export interface MasterCSSCompilerBindingSession extends Disposable {
  readonly binding: MasterCSSResolvedBinding
  findManifestEntries(projectDir: string): readonly string[]
  loadProjectManifest(
    projectDir: string,
    baseManifest: MasterCSSManifest,
    entries?: readonly string[]
  ): MasterCSSProjectManifest
  loadPreparedProjectManifest(
    projectDir: string,
    baseManifest: MasterCSSManifest,
    graphs: readonly MasterCSSProjectEntryGraph[]
  ): MasterCSSProjectManifest
  compareProjectSnapshots(request: import('./protocol').MasterCSSProjectComparisonRequest): import('./protocol').MasterCSSProjectComparison
  inspectCSS(source: string): MasterCSSCompilerInspection
  compileNativeCSS(
    source: string,
    options?: MasterCSSDirectiveCompileOptions
  ): MasterCSSDirectiveCompilation
  compileCSSDirectives(
    source: string,
    options?: MasterCSSDirectiveCompileOptions
  ): MasterCSSDirectiveCompilation
  analyzeCSSDependencies(source: string): MasterCSSDependencyAnalysis
  analyzeStandaloneDirectives(source: string): MasterCSSStandaloneDirectiveAnalysis
  mergeCSSExtractionPolicies(
    policies: readonly Partial<MasterCSSDirectiveExtractionPolicy>[]
  ): MasterCSSDirectiveExtractionPolicy
  filterCSSExtractionCandidates(
    candidates: readonly string[],
    blocklist: readonly (string | MasterCSSRegex)[]
  ): readonly string[]
  compileManifestInput(
    input: MasterCSSDirectiveManifestInput,
    options?: MasterCSSCompileManifestOptions
  ): MasterCSSCompileManifestResult
  lowerCSSDirectives(
    request: MasterCSSLowerDirectivesRequest,
    options?: MasterCSSLowerDirectivesOptions,
    sourceText?: string
  ): MasterCSSLowerDirectivesResult
  /**
   * `lowerCSSDirectives` whose manifests stay in the binding: the options may pass
   * references in place of manifests, and the result returns references.
   */
  lowerCSSDirectivesWithReferences(
    request: MasterCSSLowerDirectivesRequest,
    options?: import('./manifest-references').MasterCSSManifestSources,
    sourceText?: string
  ): Omit<MasterCSSLowerDirectivesResult, 'manifest' | 'resolutionManifest'> & {
    manifest: import('./manifest-references').MasterCSSManifestReference
    resolutionManifest: import('./manifest-references').MasterCSSManifestReference
  }
  normalizeManifest(manifest: MasterCSSManifest): MasterCSSManifest
  normalizeDefaultManifest(manifest: MasterCSSManifest): MasterCSSManifest
  compileDefaultPresetManifest(
    request: MasterCSSCompileDefaultPresetRequest
  ): MasterCSSCompileDefaultPresetResult
  resolveCSSImportGraph(request: MasterCSSImportGraphRequest): MasterCSSResolvedImportGraph
  resolveCSSStylesheetGraph(request: MasterCSSImportGraphRequest): MasterCSSStylesheetBundle['graph']
  prepareCSSStylesheetBundle(request: MasterCSSPrepareStylesheetBundleRequest): MasterCSSStylesheetBundle
  renderCSSStylesheetBundle(request: MasterCSSRenderStylesheetBundleRequest): readonly MasterCSSStylesheetAsset[]
  compileCSSStylesheetGraph(request: MasterCSSCompileStylesheetGraphRequest): MasterCSSCompiledStylesheetGraph
  /**
   * `compileCSSStylesheetGraph` whose manifests stay in the binding: the request
   * may pass references in place of manifests, and the result returns references.
   */
  compileCSSStylesheetGraphWithReferences(
    request: import('./manifest-references').MasterCSSReferencedStylesheetGraphRequest
  ): import('./manifest-references').MasterCSSReferencedStylesheetGraph
  createInspectionReport(input: MasterCSSDiagnosticsReportInput): MasterCSSInspectionReport
  renderClassNames(
    manifest: MasterCSSManifest,
    classNames: readonly string[]
  ): MasterCSSServerRender
  dispose(): void
}

export interface MasterCSSCompilerRenderBindingSessionOptions {
  readonly manifest: MasterCSSManifest
  readonly emittedGlobals?: MasterCSSEmittedGlobals
}

export interface MasterCSSCompilerRenderBindingSession extends Disposable {
  readonly binding: MasterCSSResolvedBinding
  nativeDeclarationCandidates(
    classNames: readonly string[]
  ): readonly MasterCSSNativeDeclarationCandidate[]
  ensureClasses(classNames: readonly string[]): void
  ensureStylesheetResources(nativeCSS: string): void
  emittedGlobals(): MasterCSSEmittedGlobals
  snapshot(): MasterCSSServerRender
  dispose(): void
}
