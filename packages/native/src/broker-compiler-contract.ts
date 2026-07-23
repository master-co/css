import type {
  MasterCSSBackendLoadOptions,
  MasterCSSNativeBackendLoadOptions,
  MasterCSSWasmBackendLoadOptions
} from './backend-options'
import type {
  MasterCSSCompileDefaultPresetRequest,
  MasterCSSCompileDefaultPresetResult,
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
  MasterCSSResolvedBackend,
  MasterCSSImportGraphRequest,
  MasterCSSResolvedImportGraph,
  MasterCSSServerRender,
  MasterCSSStandaloneDirectiveAnalysis
} from './protocol'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

export type {
  MasterCSSBackendLoadOptions,
  MasterCSSNativeBackendLoadOptions,
  MasterCSSWasmBackendLoadOptions
} from './backend-options'

export interface MasterCSSCompilerBackendSession extends Disposable {
  readonly backend: MasterCSSResolvedBackend
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
  inspectCSS(source: string): MasterCSSCompilerInspection
  compileNativeCSS(
    source: string,
    options?: MasterCSSDirectiveCompileOptions
  ): MasterCSSDirectiveCompilation
  compileCSSDirectives(
    source: string,
    options?: MasterCSSDirectiveCompileOptions
  ): MasterCSSDirectiveCompilation
  compileThemeCSS(
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
    options?: MasterCSSLowerDirectivesOptions
  ): MasterCSSLowerDirectivesResult
  normalizeManifest(manifest: MasterCSSManifest): MasterCSSManifest
  normalizeDefaultManifest(manifest: MasterCSSManifest): MasterCSSManifest
  compileDefaultPresetManifest(
    request: MasterCSSCompileDefaultPresetRequest
  ): MasterCSSCompileDefaultPresetResult
  resolveCSSImportGraph(request: MasterCSSImportGraphRequest): MasterCSSResolvedImportGraph
  createInspectionReport(input: MasterCSSDiagnosticsReportInput): MasterCSSInspectionReport
  renderClassNames(
    manifest: MasterCSSManifest,
    classNames: readonly string[],
    nativeSupport?: readonly boolean[]
  ): MasterCSSServerRender
  dispose(): void
}

export interface MasterCSSCompilerRenderBackendSession extends Disposable {
  readonly backend: MasterCSSResolvedBackend
  nativeDeclarationCandidates(
    classNames: readonly string[]
  ): readonly MasterCSSNativeDeclarationCandidate[]
  ensureClasses(classNames: readonly string[], nativeSupport?: readonly boolean[]): void
  ensureStylesheetResources(nativeCSS: string): void
  emittedGlobals(): MasterCSSEmittedGlobals
  snapshot(): MasterCSSServerRender
  dispose(): void
}
