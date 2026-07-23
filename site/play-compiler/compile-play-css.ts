import type { MasterCSSManifest } from '@master/css-schema/manifest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import {
  compileBrowserStylesheet,
  type MasterCSSBrowserStylesheetCompileOptions,
  type MasterCSSBrowserStylesheetCompileResult
} from '@master/css-compiler/stylesheet/browser'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const compilerWasmURL = new URL('./mastercss_wasm_compiler_bg.wasm', import.meta.url)

export interface CompilePlayCSSResult {
  css: string
  manifest: MasterCSSManifest
  warnings: string[]
  result: MasterCSSBrowserStylesheetCompileResult['result']
}

export async function compilePlayCSS(
  sourceCSS: string,
  classes: string[],
  backend: NonNullable<MasterCSSBrowserStylesheetCompileOptions['backend']> = {
    input: compilerWasmURL
  }
): Promise<CompilePlayCSSResult> {
  const result = await compileBrowserStylesheet(sourceCSS, {
    baseManifest: defaultManifest,
    classNames: classes,
    from: 'playground.css',
    backend
  })
  return {
    css: result.css,
    manifest: result.manifest,
    warnings: result.diagnostics.map(({ message }) => message),
    result: result.result
  }
}

const playCompilerModule = { compilePlayCSS }
const globalPlayCompiler = globalThis as typeof globalThis & {
  __masterCSSPlayCompiler?: typeof playCompilerModule
  __masterCSSPlayCompilerResolve?: (module: typeof playCompilerModule) => void
}

globalPlayCompiler.__masterCSSPlayCompiler = playCompilerModule
globalPlayCompiler.__masterCSSPlayCompilerResolve?.(playCompilerModule)
