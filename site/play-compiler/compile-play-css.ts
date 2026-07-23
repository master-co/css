import type { MasterCSSManifest } from '@master/css'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import {
  compileBrowserStyleCSS,
  initBrowserStyleCompiler,
  type CompileBrowserStyleCSSResult
} from '@master/css-compiler/stylesheet/browser'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const compilerWasmURL = new URL('./mastercss_wasm_compiler_bg.wasm', import.meta.url)

export interface CompilePlayCSSResult {
  css: string
  manifest: MasterCSSManifest
  warnings: string[]
  result: CompileBrowserStyleCSSResult['result']
}

async function initPlayCompiler() {
  if (typeof window === 'undefined') return

  await initBrowserStyleCompiler(compilerWasmURL)
}

export async function compilePlayCSS(sourceCSS: string, classes: string[]): Promise<CompilePlayCSSResult> {
  await initPlayCompiler()

  const result = await compileBrowserStyleCSS(sourceCSS, {
    baseManifest: defaultManifest,
    classNames: classes,
    from: 'playground.css'
  })
  return {
    css: result.css,
    manifest: result.manifest,
    warnings: result.warnings,
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
