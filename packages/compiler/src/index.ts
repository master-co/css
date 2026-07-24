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
  readonly onDiagnostic?: (diagnostic: MasterCSSDiagnostic) => void
}

export interface MasterCSSCompileResult {
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
