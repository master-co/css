import { createRenderBackendSessionSync } from '@master/css-backend/engine/node'
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

export function renderCompiledManifestCSS(options: RenderCompiledManifestCSSOptions): RenderCompiledManifestCSSResult {
  const nativeSession = createRenderBackendSessionSync(options)
  const session: StylesheetRenderSession = {
    nativeDeclarationCandidates: (classNames) =>
      [...nativeSession.nativeDeclarationCandidates(classNames)],
    ensureClasses: (classNames, nativeSupport) => nativeSession.ensureClassRules(classNames, nativeSupport),
    ensureStylesheetResources: (nativeCSS) => nativeSession.ensureStylesheetResources(nativeCSS),
    emittedGlobals: () => nativeSession.emittedGlobals() as Required<import('@master/css-schema/emitted-globals').MasterCSSEmittedGlobals>,
    snapshot: () => nativeSession.snapshot(),
    dispose: () => nativeSession.dispose()
  }

  try {
    return renderCompiledManifestCSSWithSession(options, session)
  } finally {
    session.dispose()
  }
}
