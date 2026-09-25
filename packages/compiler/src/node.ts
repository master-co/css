import { stylesheetValidationSource } from './stylesheet/output-map'
import { validateCompiledCSS, assertValidationOptions } from './value-validation'
import {
  MasterCSSCompiler,
  bindCompilerSessionInternal,
  toMasterCSSCompileManifestResultInternal
} from './compiler'
import type { MasterCSSCompileManifestOptions, MasterCSSCompileManifestResult, MasterCSSCompileStylesheetsResult } from './index'
import { compileDeliveredFile, type StylesheetDeliveryOptions, type StylesheetResourceAsset } from './stylesheet/delivery'
import {
  bindCompilerBindingSessionInternal
} from './session'
import {
  createCompilerBindingSessionSync as createBindingSessionSync
} from '@master/css-binding/compiler/node'
import { compileCSSManifestFile } from './node-compiler'

export {
  type MasterCSSCompileManifestOptions,
  type MasterCSSCompileManifestResult,
  type MasterCSSCompileOptions,
  type MasterCSSCompileResult,
  type MasterCSSPrepareStylesheetBundleRequest,
  type MasterCSSStylesheetBundle,
  type MasterCSSRenderStylesheetBundleRequest,
  type MasterCSSStylesheetAsset,
  type MasterCSSCompileStylesheetsRequest,
  type MasterCSSCompileStylesheetsResult,
  type MasterCSSCompilerInspection
} from './index'
export {
  collectStylesheetDependenciesSync,
  resolveStylesheetDependenciesSync,
  type MasterCSSStylesheetDependencies,
  composeStylesheetHostSync,
  resolveStylesheetSync,
  type MasterCSSStylesheetDependencyOptions,
  type MasterCSSStylesheetHostOptions,
  type MasterCSSStylesheetResolution,
  type MasterCSSStylesheetResolutionOptions
} from './stylesheet/public'

export interface MasterCSSCompileManifestFileOptions
  extends MasterCSSCompileManifestOptions {
  readonly root?: string
}

export interface MasterCSSCompileManifestFileDeliveryOptions extends MasterCSSCompileManifestFileOptions {
  readonly delivery: StylesheetDeliveryOptions
}

export interface MasterCSSCompileManifestFileResult extends MasterCSSCompileStylesheetsResult {
  /** Copy these files to their hrefs before publishing the entry stylesheet. */
  readonly resources: readonly Readonly<StylesheetResourceAsset>[]
}

export function createCompilerSync() {
  return bindCompilerSessionInternal(
    bindCompilerBindingSessionInternal(createBindingSessionSync())
  )
}

export function inspectCSSSync(source: string) {
  using compiler = createCompilerSync()
  return compiler.inspectCSS(source)
}

export function compileCSSSync(
  source: string,
  options: import('./index').MasterCSSCompileOptions = {}
) {
  using compiler = createCompilerSync()
  return compiler.compileCSS(source, options)
}

export function compileManifestSync(
  source: string,
  options: import('./index').MasterCSSCompileManifestOptions
) {
  using compiler = createCompilerSync()
  return compiler.compileManifest(source, options)
}

export function compileManifestFileSync(
  file: string,
  options: MasterCSSCompileManifestFileDeliveryOptions
): MasterCSSCompileManifestFileResult
export function compileManifestFileSync(
  file: string,
  options: MasterCSSCompileManifestFileOptions
): MasterCSSCompileManifestResult
export function compileManifestFileSync(
  file: string,
  options: MasterCSSCompileManifestFileOptions | MasterCSSCompileManifestFileDeliveryOptions
): MasterCSSCompileManifestResult | MasterCSSCompileManifestFileResult {
  assertValidationOptions(options)
  if ('delivery' in options) {
    const result = compileDeliveredFile(file, {
      ...options,
      projectDir: options.root,
      preserveNativeCSS: options.preserveNativeCSS ?? true
    })
    return Object.freeze({
      ...toMasterCSSCompileManifestResultInternal({ ...result.directives, manifest: result.manifest, directives: result.directives }, options.onDiagnostic, options.validation),
      diagnostics: validateCompiledCSS(result.stylesheets.map(asset => stylesheetValidationSource(asset.css, asset.id, undefined, asset.outputMappings)), options),
      entry: result.entry,
      stylesheets: Object.freeze(result.stylesheets.map(asset => Object.freeze({ ...asset }))),
      resources: Object.freeze(result.resources.map(asset => Object.freeze({ ...asset })))
    })
  }
  return toMasterCSSCompileManifestResultInternal(
    compileCSSManifestFile(file, options),
    options.onDiagnostic,
    options.validation
  )
}

export function migrateRCSync(request: import('./index').MasterCSSRCMigrationRequest): import('./index').MasterCSSRCMigrationResult {
  using session = createBindingSessionSync()
  return session.migrateRC(request)
}
