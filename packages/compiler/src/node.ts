import {
  MasterCSSCompiler,
  bindCompilerSessionInternal,
  toMasterCSSCompileManifestResultInternal
} from './compiler'
import type { MasterCSSCompileManifestOptions } from './index'
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
  type MasterCSSCompilerInspection
} from './index'
export {
  collectStylesheetDependenciesSync,
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
  options: MasterCSSCompileManifestFileOptions
) {
  return toMasterCSSCompileManifestResultInternal(
    compileCSSManifestFile(file, options),
    options.onDiagnostic
  )
}
