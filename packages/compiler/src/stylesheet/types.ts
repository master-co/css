import type { CompileCSSOptions, CompileCSSResult } from '../node-compiler'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { RenderCompiledManifestCSSResult } from './render'
import type { StylesheetDirectives, StylesheetSourceOptions } from './directives'

export interface SassModule {
  compileStringAsync(source: string, options: {
    url: URL
    style: 'expanded'
    syntax: 'scss' | 'indented'
  }): Promise<{ css: string }>
}

export interface CompileStylesheetOptions extends CompileCSSOptions {
  readonly baseManifest: MasterCSSManifest
  projectDir?: string
  loadSass?: (projectDir?: string) => SassModule
}

export interface CompileRenderedStylesheetResult extends CompileCSSResult {
  emittedGlobals: Required<MasterCSSEmittedGlobals>
  manifest: MasterCSSManifest
  renderedCSS: RenderCompiledManifestCSSResult
}

export interface TransformLocalStylesheetResult {
  code: string
  dependencies: string[]
  transformed: boolean
  result?: CompileCSSResult
}

export interface TransformLocalStylesheetOptions extends CompileStylesheetOptions {
  emittedGlobals?: MasterCSSEmittedGlobals
}

export type RegisterStylesheetSourceOptions = CompileStylesheetOptions

export type CreateStyleEntryEmittedGlobalsOptions = CompileStylesheetOptions

export interface CreateStyleEntryEmittedGlobalsResult {
  emittedGlobals: Required<MasterCSSEmittedGlobals>
  dependencies: string[]
}

export interface CreateExtractedCSSOptions extends CompileStylesheetOptions {
  scanner: ScannerState
  stylesheetSources?: StylesheetSources
  manifest?: MasterCSSManifest
  includeGeneratedCSS?: boolean
  includeNativeCSS?: boolean
  includeMasterBaseCSS?: boolean
}

export interface CreateExtractedCSSResult {
  css: string
  emittedGlobals: Required<MasterCSSEmittedGlobals>
}

export interface ScannerCSSState {
  readonly text: string
  readonly manifest: MasterCSSManifest
}

export interface ScannerClassState extends Iterable<string> {
  readonly size: number
  has(className: string): boolean
}

export interface ScannerState {
  cwd: string
  options: StylesheetSourceOptions
  customOptions?: {
    manifest?: MasterCSSManifest
  }
  css: ScannerCSSState
  latentClasses: ScannerClassState
  validClasses: ScannerClassState
  usedNativeClasses: ScannerClassState
  nativeClassNames: ScannerClassState
  registerNativeClasses?: (classNames: string[]) => boolean
  emit?: (event: 'change') => unknown
}

export interface StylesheetSource {
  source: string
  pruneNativeCSS: boolean
  masterCSS: boolean
  directives: StylesheetDirectives
  dependencies: string[]
  sourceDependencies: string[]
}

export type StylesheetSources = Map<string, StylesheetSource>

export interface ResolvedStylesheetSource {
  source: string
  dependencies: string[]
}

export interface ResolveStylesheetImportGraphOptions {
  expandMasterCSSPackage?: boolean
}

export interface CreateStylesheetHostSourceOptions {
  masterImport?: string
  masterSource?: string
}
