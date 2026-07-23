import {
  compileCSSManifest,
  initCSSCompiler,
  type CompileCSSManifestResult
} from '@master/css-compiler/browser'
import { createCompilerRenderSession } from '@master/css-wasm-compiler'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import {
  renderCompiledManifestCSSWithSession,
  type RenderCompiledManifestCSSResult,
  type StylesheetRenderSession
} from './render-core'

export interface CompileBrowserStyleCSSOptions {
  baseManifest?: MasterCSSManifest
  classNames?: Iterable<string>
  from?: string
  preserveNativeCSS?: boolean
  onWarning?: (warning: string) => void
}

export interface CompileBrowserStyleCSSResult {
  css: string
  nativeCSS: string
  generatedCSS: string
  manifest: MasterCSSManifest
  warnings: string[]
  emittedGlobals: Required<MasterCSSEmittedGlobals>
  result: CompileCSSManifestResult
}

export async function initBrowserStyleCompiler(input?: Parameters<typeof initCSSCompiler>[0]) {
  await initCSSCompiler(input)
}

export async function compileBrowserStyleCSS(source: string, options: CompileBrowserStyleCSSOptions = {}): Promise<CompileBrowserStyleCSSResult> {
  const {
    baseManifest,
    classNames,
    from,
    preserveNativeCSS,
    onWarning
  } = options
  const result = await compileCSSManifest(source, {
    ...(baseManifest ? { baseManifest } : {}),
    ...(from ? { from } : {}),
    ...(preserveNativeCSS === undefined ? {} : { preserveNativeCSS }),
    ...(onWarning ? { onWarning } : {})
  })
  const renderSession = await createCompilerRenderSession(
    stringifyMasterCSSManifestJSON(result.manifest)
  ) as StylesheetRenderSession
  let renderedCSS: RenderCompiledManifestCSSResult
  try {
    renderedCSS = renderCompiledManifestCSSWithSession({
      manifest: result.manifest,
      nativeCSS: result.css || '',
      classNames
    }, renderSession)
  } finally {
    renderSession.dispose()
  }

  return {
    css: renderedCSS.css,
    nativeCSS: renderedCSS.nativeCSS,
    generatedCSS: renderedCSS.generatedCSS,
    manifest: result.manifest,
    warnings: result.warnings,
    emittedGlobals: renderedCSS.emittedGlobals,
    result
  }
}

export type { CompileCSSManifestResult }
