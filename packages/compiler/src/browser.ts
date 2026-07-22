import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  createCompilerWasmSession,
  type InitCompilerWasmOptions
} from '@master/css-wasm-compiler'
import type { CompileCSSOptions, CompileCSSResult } from './contracts'
import { bindWasmCompilerSession, type CompilerSession } from './session'

export { CompilerSessionError, type CompilerSession } from './session'

export type * from './contracts'

export type CompileCSSManifestSourceOptions = CompileCSSOptions & {
  baseManifest?: MasterCSSManifest
}

export interface CompileCSSManifestResult extends Omit<CompileCSSResult, 'manifestInput'> {
  manifest: MasterCSSManifest
  directives: CompileCSSResult
}

let compilerPromise: Promise<CompilerSession> | undefined

export async function createCompiler(options: InitCompilerWasmOptions = {}) {
  return bindWasmCompilerSession(await createCompilerWasmSession(options))
}

export async function initCSSCompiler(input?: InitCompilerWasmOptions['input']) {
  compilerPromise ??= createCompiler({ input })
  await compilerPromise
}

export async function compileCSS(source: string, options: CompileCSSOptions = {}): Promise<CompileCSSResult> {
  await initCSSCompiler()
  return (await compilerPromise!).compileCSS(source, options)
}

export async function compileCSSManifest(source: string, options: CompileCSSManifestSourceOptions = {}): Promise<CompileCSSManifestResult> {
  const result = await compileCSS(source, options)
  if (result.references?.length) {
    throw new Error('Browser compileCSSManifest cannot resolve @reference directives. Inline referenced CSS or compile the stylesheet in a Node environment.')
  }

  const { manifestInput: _manifestInput, ...directiveData } = result
  const lowerResult = (await compilerPromise!).lowerCSSDirectives<{
    manifest: MasterCSSManifest
    warnings: string[]
    generatedCSS: string
  }>({
    manifestInput: result.manifestInput,
    styleDefinitions: result.styleDefinitions || [],
    warnings: result.warnings
  }, {
    baseManifest: options.baseManifest
  })
  for (const warning of lowerResult.warnings) options.onWarning?.(warning)
  const generatedCSS = lowerResult.generatedCSS || ''
  const css = [
    result.nativeCSS,
    generatedCSS
  ].filter(Boolean).join('\n')

  return {
    ...directiveData,
    dependencies: [],
    manifest: lowerResult.manifest,
    warnings: lowerResult.warnings,
    generatedCSS,
    css,
    directives: result
  }
}

export async function parseDirectives(source: string, options: CompileCSSOptions = {}) {
  const { manifestInput, extractionPolicy, classNames, nativeClassNames, warnings, styleDefinitions } = await compileCSS(source, options)
  return {
    manifestInput,
    extractionPolicy,
    classNames,
    nativeClassNames,
    warnings,
    ...(styleDefinitions ? { styleDefinitions } : {})
  }
}
