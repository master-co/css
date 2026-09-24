import type { MasterCSSDiagnostic } from '@master/css-schema'
import type {
  MasterCSSBinding,
  MasterCSSWasmBindingLoadOptions
} from '@master/css-binding'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createCompilerBindingSession } from './session'
import {
  MasterCSSCompiler,
  bindCompilerSessionInternal
} from './compiler'

export { MasterCSSCompiler } from './compiler'

export interface MasterCSSCompilerOptions {
  readonly binding?: MasterCSSBinding
  readonly wasm?: MasterCSSWasmBindingLoadOptions
}

export interface MasterCSSCompileOptions {
  readonly classes?: readonly string[]
  readonly from?: string
  readonly preserveNativeCSS?: boolean
  /** Opt in to pruning native rules in project-owned files. */
  readonly pruneNativeCSS?: boolean
  /** Keep untouched native source for host transforms; incompatible with class pruning. */
  readonly preserveNativeSource?: boolean
  /** Report CSS value errors by default; error rejects the complete output. */
  readonly cssValuePolicy?: 'report' | 'error'
  readonly onDiagnostic?: (diagnostic: MasterCSSDiagnostic) => void
}

export interface MasterCSSCompileResult {
  /** Serialized map v3 for css when produced by a stylesheet host. */
  readonly sourceMap?: string
  readonly css: string
  readonly nativeCSS: string
  readonly generatedCSS: string
  readonly classNames: readonly string[]
  readonly nativeClassNames: readonly string[]
  readonly dependencies: readonly string[]
  readonly diagnostics: readonly MasterCSSDiagnostic[]
  readonly directiveSummary: Readonly<{
    readonly manifestInput: Readonly<{
      readonly keys: readonly string[]
      readonly counts: Readonly<Record<string, number>>
    }>
    readonly styleDefinitions: number
    readonly extractionPolicy: Readonly<{
      readonly include: readonly string[]
      readonly exclude: readonly string[]
      readonly safelist: readonly string[]
      readonly blocklist: readonly (string | RegExp)[]
      readonly preserveNative: boolean
      readonly pruneNative: boolean
    }>
  }>
}

export interface MasterCSSCompileManifestOptions extends MasterCSSCompileOptions {
  readonly baseManifest: MasterCSSManifest
}

export interface MasterCSSCompileManifestResult extends MasterCSSCompileResult {
  readonly manifest: MasterCSSManifest
  readonly directives: MasterCSSCompileResult
}

/**
 * Prepared files/edges and delivery URLs for boundary-preserving compilation.
 * Resolve @reference inputs into resolutionManifest before calling this API.
 * Supply resourceURLs to relocate parsed url()/image-set() resources before definition merging.
 * Without that map, delivery URLs must retain the original resource bases.
 */
export type MasterCSSCompileStylesheetsRequest = import('@master/css-binding/compiler').MasterCSSCompileStylesheetGraphRequest

export interface MasterCSSCompileStylesheetsResult extends MasterCSSCompileManifestResult {
  readonly entry: string
  /** Every stylesheet must be delivered at its href, including the entry. */
  readonly stylesheets: readonly Readonly<import('@master/css-binding/compiler').MasterCSSCompiledStylesheet>[]
}

/** Prepare source boundaries before the host assigns final asset URLs. */
export type MasterCSSPrepareStylesheetBundleRequest = import('@master/css-binding/compiler').MasterCSSPrepareStylesheetBundleRequest
export type MasterCSSStylesheetBundle = import('@master/css-binding/compiler').MasterCSSStylesheetBundle
/** Render all assets; relative ordinary resources/imports require explicit URL mappings. */
export type MasterCSSRenderStylesheetBundleRequest = import('@master/css-binding/compiler').MasterCSSRenderStylesheetBundleRequest
export type MasterCSSStylesheetAsset = import('@master/css-binding/compiler').MasterCSSStylesheetAsset

export interface MasterCSSCompilerInspection {
  readonly hasMasterEntryDirective: boolean
  readonly hasMasterCSSImport: boolean
  readonly hasMasterEntry: boolean
  readonly directives: readonly {
    readonly name: string
    readonly range: { readonly start: number, readonly end: number }
    readonly preludeRange: { readonly start: number, readonly end: number }
    readonly hasBlock: boolean
    readonly quotedStrings: number
  }[]
}

export async function createCompiler(
  options: MasterCSSCompilerOptions = {}
): Promise<MasterCSSCompiler> {
  return bindCompilerSessionInternal(await createCompilerBindingSession({
    binding: options.binding,
    wasm: options.wasm
  }))
}

export async function inspectCSS(source: string): Promise<MasterCSSCompilerInspection> {
  const compiler = await createCompiler()
  try {
    return compiler.inspectCSS(source)
  } finally {
    compiler.dispose()
  }
}

export async function compileCSS(
  source: string,
  options: MasterCSSCompileOptions = {}
): Promise<MasterCSSCompileResult> {
  const compiler = await createCompiler()
  try {
    return compiler.compileCSS(source, options)
  } finally {
    compiler.dispose()
  }
}

export async function compileManifest(
  source: string,
  options: MasterCSSCompileManifestOptions
): Promise<MasterCSSCompileManifestResult> {
  const compiler = await createCompiler()
  try {
    return compiler.compileManifest(source, options)
  } finally {
    compiler.dispose()
  }
}

export type MasterCSSRCMigrationRequest = Parameters<import('./session').BindingCompilerSession['migrateRC']>[0]
export type MasterCSSRCMigrationResult = ReturnType<import('./session').BindingCompilerSession['migrateRC']>

export async function migrateRC(request: MasterCSSRCMigrationRequest): Promise<MasterCSSRCMigrationResult> {
  const session = await createCompilerBindingSession()
  try { return session.migrateRC(request) } finally { session.dispose() }
}
