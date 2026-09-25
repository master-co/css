import type { StylesheetSourceContext } from './source-context'
import type { StylesheetDeliveryOptions, StylesheetResourceAsset } from './delivery'
import type { PreparedCSSImportGraph } from '../node-imports'
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
    sourceMap?: boolean
    sourceMapIncludeSources?: boolean
  }): Promise<{ css: string, loadedUrls?: readonly URL[], sourceMap?: object }>
}

export interface StylesheetPreparationOptions {
  readonly projectDir?: string
  readonly baseFile?: string
  readonly loadSass?: (projectDir?: string) => SassModule
  readonly onDependency?: (file: string) => void
  readonly signal?: AbortSignal
}

export interface PreparedStylesheetSource {
  readonly id: string
  readonly baseFile: string
  readonly source: string
  readonly dependencies: readonly string[]
  /** Serialized Sass source map v3, including original source contents. */
  readonly sourceMap?: string
}

export interface CompileStylesheetOptions extends CompileCSSOptions, StylesheetSourceContext {
  /** Internal metadata retained when source collection removes import directives. */
  references?: CompileCSSResult['references']
  delivery?: StylesheetDeliveryOptions
  readonly baseManifest: MasterCSSManifest
  projectDir?: string
  loadSass?: (projectDir?: string) => SassModule
}

export interface CompileRenderedStylesheetOptions extends CompileStylesheetOptions {
  /** Globals already present outside this render; emit only additional resources. */
  readonly emittedGlobals?: MasterCSSEmittedGlobals
}

export interface CompileRenderedStylesheetResult extends CompileCSSResult {
  /** Present with delivery options; publish every returned stylesheet at its href. */
  entry?: string
  stylesheets?: readonly { readonly id: string, readonly href: string, readonly css: string, readonly sourceMap: string }[]
  resources?: readonly StylesheetResourceAsset[]
  emittedGlobals: Required<MasterCSSEmittedGlobals>
  manifest: MasterCSSManifest
  renderedCSS: RenderCompiledManifestCSSResult
}

export interface TransformLocalStylesheetResult {
  stylesheets?: readonly { readonly id: string, readonly href: string, readonly css: string, readonly sourceMap?: string }[]
  resources?: readonly StylesheetResourceAsset[]
  code: string
  dependencies: string[]
  transformed: boolean
  result?: CompileCSSResult
}

export interface TransformLocalStylesheetOptions extends CompileStylesheetOptions {
  transformNativeStylesheets?: boolean
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
  stylesheets?: readonly { readonly id: string, readonly href: string, readonly css: string, readonly sourceMap?: string }[]
  resources?: readonly StylesheetResourceAsset[]
  dependencies?: readonly string[]
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
  customOptions?: StylesheetSourceOptions & {
    manifest?: MasterCSSManifest
  }
  css: ScannerCSSState
  latentClasses: ScannerClassState
  validClasses: ScannerClassState
  usedNativeClasses: ScannerClassState
  nativeClassNames: ScannerClassState
  registerNativeClasses?: (owner: string, classNames: string[]) => boolean
  emit?: (event: 'change') => unknown
}

export interface StylesheetSource {
  references?: CompileCSSResult['references']
  graph?: PreparedCSSImportGraph
  source: string
  pruneNativeCSS: boolean
  masterCSS: boolean
  directives: StylesheetDirectives
  dependencies: string[]
  sourceDependencies: string[]
}

export type StylesheetSources = Map<string, StylesheetSource>

export interface ResolvedStylesheetSource {
  references?: CompileCSSResult['references']
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
