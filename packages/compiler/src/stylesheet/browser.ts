import {
  compileManifest,
  type MasterCSSCompileManifestResult
} from '../index'
import { createCompilerRenderSession } from '@master/css-wasm-compiler'
import type { MasterCSSDiagnostic } from '@master/css-schema'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import {
  renderCompiledManifestCSSWithSession,
  type RenderCompiledManifestCSSResult,
  type StylesheetRenderSession
} from './render-core'

export interface CompileBrowserStylesheetOptions {
  readonly baseManifest: MasterCSSManifest
  readonly classNames?: Iterable<string>
  readonly from?: string
  readonly preserveNativeCSS?: boolean
  readonly onDiagnostic?: (diagnostic: import('@master/css-schema').MasterCSSDiagnostic) => void
}

export interface CompileBrowserStylesheetResult {
  readonly css: string
  readonly nativeCSS: string
  readonly generatedCSS: string
  readonly manifest: MasterCSSManifest
  readonly diagnostics: readonly MasterCSSDiagnostic[]
  readonly emittedGlobals: Required<MasterCSSEmittedGlobals>
  readonly result: MasterCSSCompileManifestResult
}

export async function compileBrowserStylesheet(
  source: string,
  options: CompileBrowserStylesheetOptions
): Promise<CompileBrowserStylesheetResult> {
  const {
    baseManifest,
    classNames,
    from,
    preserveNativeCSS,
    onDiagnostic
  } = options
  const result = await compileManifest(source, {
    baseManifest,
    ...(from ? { from } : {}),
    ...(preserveNativeCSS === undefined ? {} : { preserveNativeCSS }),
    ...(onDiagnostic ? { onDiagnostic } : {})
  })
  const renderSession = await createCompilerRenderSession(
    serializeMasterCSSManifest(result.manifest)
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
    diagnostics: result.diagnostics,
    emittedGlobals: renderedCSS.emittedGlobals,
    result
  }
}

export type { MasterCSSCompileManifestResult }
