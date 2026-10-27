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

/** Compare canonical Rust reference counts; referenced theme variables and keyframes are managed. */
export function hasStylesheetResourceReferences(manifest: RenderCompiledManifestCSSOptions['manifest'], source: string): boolean {
  const session = createRenderBindingSessionSync({ manifest })
  try {
    const before = session.snapshot().snapshot.resources
    session.ensureStylesheetResources(source)
    const rendered = session.snapshot()
    const after = rendered.snapshot.resources
    return after.variables.some(value => value.refCount > (before.variables.find(item => item.name === value.name)?.refCount ?? 0))
      || after.keyframes.some(value => value.refCount > (before.keyframes.find(item => item.id === value.id)?.refCount ?? 0))
      // Render sessions treat keyframes a stylesheet animates through its own slot as
      // emitted by the page instead of counting them. Only the transformed stylesheet
      // anchors them and emits the theme tokens their frames read.
      || Object.keys(rendered.hydrationManifest.emittedGlobals?.keyframes ?? {}).length > 0
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
