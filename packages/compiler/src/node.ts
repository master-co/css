import {
  MasterCSSCompiler,
  bindCompilerSessionInternal,
  toMasterCSSCompileManifestResultInternal
} from './compiler'
import type { MasterCSSCompileManifestOptions } from './index'
import {
  createCompilerBackendSessionSync
} from './session'
import { compileCSSManifestFile } from './node-compiler'

export {
  type MasterCSSCompileManifestOptions,
  type MasterCSSCompileManifestResult,
  type MasterCSSCompileOptions,
  type MasterCSSCompileResult,
  type MasterCSSCompilerInspection
} from './index'

export interface MasterCSSCompileManifestFileOptions
  extends MasterCSSCompileManifestOptions {
  readonly root?: string
}

export function createCompilerSync() {
  return bindCompilerSessionInternal(createCompilerBackendSessionSync())
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
