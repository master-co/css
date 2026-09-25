import { validateCompiledCSS, assertValidationOptions } from '../value-validation'
import {
  createCompiler,
  type MasterCSSCompileManifestResult
} from '../index'
import { createCompilerRenderBindingSession } from '@master/css-binding/compiler'
import type { MasterCSSDiagnostic } from '@master/css-schema'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  renderCompiledManifestCSSWithSession,
  type RenderCompiledManifestCSSResult,
  type StylesheetRenderSession
} from './render-core'

export interface MasterCSSBrowserStylesheetCompileOptions {
  readonly baseManifest: MasterCSSManifest
  readonly classNames?: readonly string[]
  readonly from?: string
  readonly preserveNativeCSS?: boolean
  readonly pruneNativeCSS?: boolean
  readonly validation?: 'report' | 'error'
  /** Keep untouched native source for host transforms; incompatible with class pruning. */
  readonly preserveNativeSource?: boolean
  /** Globals already present outside this render; emit only additional resources. */
  readonly emittedGlobals?: MasterCSSEmittedGlobals
  readonly binding?: Readonly<{
    input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module
  }>
  readonly signal?: AbortSignal
  readonly onDiagnostic?: (diagnostic: import('@master/css-schema').MasterCSSDiagnostic) => void
}

export interface MasterCSSBrowserStylesheetCompileResult {
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
  options: MasterCSSBrowserStylesheetCompileOptions
): Promise<MasterCSSBrowserStylesheetCompileResult> {
  assertValidationOptions(options)
  const {
    baseManifest,
    classNames,
    from,
    preserveNativeCSS,
    preserveNativeSource,
    emittedGlobals,
    binding,
    signal,
    onDiagnostic
  } = options
  signal?.throwIfAborted()
  const compiler = await createCompiler({
    binding: 'wasm',
    ...(binding ? { wasm: binding } : {})
  })
  let result: MasterCSSCompileManifestResult
  try {
    result = compiler.compileManifest(source, {
      baseManifest,
      pruneNativeCSS: options.pruneNativeCSS,
      classes: classNames,
      validation: options.validation,
      ...(from ? { from } : {}),
      ...(preserveNativeCSS === undefined ? {} : { preserveNativeCSS }),
      ...(preserveNativeSource === undefined ? {} : { preserveNativeSource }),
      ...(onDiagnostic ? { onDiagnostic } : {})
    })
  } finally {
    compiler.dispose()
  }
  signal?.throwIfAborted()
  const bindingSession = await createCompilerRenderBindingSession(
    { manifest: result.manifest, emittedGlobals },
    { binding: 'wasm', wasm: binding }
  )
  const renderSession: StylesheetRenderSession = {
    nativeDeclarationCandidates: (classNames) =>
      bindingSession.nativeDeclarationCandidates(classNames),
    ensureClasses: (classNames) =>
      bindingSession.ensureClasses(classNames),
    ensureStylesheetResources: (nativeCSS) =>
      bindingSession.ensureStylesheetResources(nativeCSS),
    emittedGlobals: () =>
      bindingSession.emittedGlobals() as Required<MasterCSSEmittedGlobals>,
    snapshot: () => bindingSession.snapshot(),
    dispose: () => bindingSession.dispose()
  }
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
  signal?.throwIfAborted()

  return Object.freeze({
    css: renderedCSS.css,
    nativeCSS: renderedCSS.nativeCSS,
    generatedCSS: renderedCSS.generatedCSS,
    manifest: result.manifest,
    diagnostics: Object.freeze([...result.diagnostics, ...validateCompiledCSS([{ css: renderedCSS.generatedCSS, source: from }], options)]),
    emittedGlobals: Object.freeze({
      variables: Object.freeze({ ...renderedCSS.emittedGlobals.variables }),
      animations: Object.freeze({ ...renderedCSS.emittedGlobals.animations })
    }),
    result
  })
}

export type { MasterCSSCompileManifestResult }
