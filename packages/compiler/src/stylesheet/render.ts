import { createRenderBindingSessionSync } from '@master/css-binding/engine/node'
import {
  renderCompiledManifestCSSWithSession,
  type RenderCompiledManifestCSSOptions,
  type RenderCompiledManifestCSSResult,
  type StylesheetRenderSession
} from './render-core'

export type {
  RenderCompiledManifestCSSOptions,
  RenderCompiledManifestCSSResult
} from './render-core'

/** Compare canonical Rust reference counts; static resources alone are not usage. */
export function hasStylesheetResourceReferences(manifest: RenderCompiledManifestCSSOptions['manifest'], source: string): boolean {
  const session = createRenderBindingSessionSync({ manifest })
  try {
    const before = session.snapshot().snapshot.resources
    session.ensureStylesheetResources(source)
    const after = session.snapshot().snapshot.resources
    return after.variables.some(value => value.refCount > (before.variables.find(item => item.name === value.name)?.refCount ?? 0))
      || after.animations.some(value => value.refCount > (before.animations.find(item => item.name === value.name)?.refCount ?? 0))
  } finally { session.dispose() }
}

export function renderCompiledManifestCSS(options: RenderCompiledManifestCSSOptions): RenderCompiledManifestCSSResult {
  const nativeSession = createRenderBindingSessionSync(options)
  const session: StylesheetRenderSession = {
    ensureClasses: (classNames) => nativeSession.ensureClassRules(classNames),
    ensureStylesheetResources: (nativeCSS) => nativeSession.ensureStylesheetResources(nativeCSS),
    emittedGlobals: () => nativeSession.emittedGlobals() as Required<import('@master/css-schema/emitted-globals').MasterCSSEmittedGlobals>,
    snapshot: () => nativeSession.snapshot(),
    dispose: () => nativeSession.dispose()
  }

  try {
    return renderCompiledManifestCSSWithSession(
      options,
      session
    )
  } finally {
    session.dispose()
  }
}
