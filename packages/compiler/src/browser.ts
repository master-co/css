import init, { transform } from 'lightningcss-wasm'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  compileCSS as compileCSSCore,
  parseDirectives as parseDirectivesCore,
  setCSSTransform,
  type CompileCSSOptions,
  type CompileCSSResult
} from './core'
import lowerCSSDirectives from './lower-css-directives'

export type * from './core'

export type CompileCSSManifestSourceOptions = CompileCSSOptions & {
  baseManifest?: MasterCSSManifest
}

export interface CompileCSSManifestResult extends Omit<CompileCSSResult, 'manifestInput'> {
  manifest: MasterCSSManifest
  directives: CompileCSSResult
}

let initPromise: Promise<void> | undefined

export async function initCSSCompiler(input?: Parameters<typeof init>[0]) {
  initPromise ??= init(input).then(() => {
    setCSSTransform(transform as any)
  })
  await initPromise
}

export async function compileCSS(source: string, options: CompileCSSOptions = {}): Promise<CompileCSSResult> {
  await initCSSCompiler()
  return compileCSSCore(source, options)
}

export async function compileCSSManifest(source: string, options: CompileCSSManifestSourceOptions = {}): Promise<CompileCSSManifestResult> {
  const result = await compileCSS(source, options)
  if (result.references?.length) {
    throw new Error('Browser compileCSSManifest cannot resolve @reference directives. Inline referenced CSS or compile the stylesheet in a Node environment.')
  }

  const { manifestInput: _manifestInput, ...directiveData } = result
  const lowerResult = lowerCSSDirectives(result, {
    baseManifest: options.baseManifest,
    onWarning: options.onWarning
  })
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
  await initCSSCompiler()
  return parseDirectivesCore(source, options)
}
