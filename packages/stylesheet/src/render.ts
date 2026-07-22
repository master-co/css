import { loadNativeBinding } from '@master/css-native'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import type {
  MasterCSSNativeDeclarationCandidateIR,
  MasterCSSServerRenderIR
} from '@master/css-schema/rust-contract'
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
  const loaded = loadNativeBinding({ required: true })!
  const nativeSession = new loaded.binding.RenderSession(
    stringifyMasterCSSManifestJSON(options.manifest),
    options.emittedGlobals ? JSON.stringify(options.emittedGlobals) : undefined
  )
  const session: StylesheetRenderSession = {
    nativeDeclarationCandidates: (classNames) =>
      JSON.parse(nativeSession.nativeDeclarationCandidates(classNames)) as MasterCSSNativeDeclarationCandidateIR[],
    ensureClasses: (classNames, nativeSupport) => nativeSession.ensureClasses(classNames, nativeSupport),
    ensureStylesheetResources: (nativeCSS) => nativeSession.ensureStylesheetResources(nativeCSS),
    emittedGlobals: () => JSON.parse(nativeSession.emittedGlobals()),
    snapshot: () => JSON.parse(nativeSession.snapshot()) as MasterCSSServerRenderIR,
    dispose: () => nativeSession.dispose()
  }

  try {
    return renderCompiledManifestCSSWithSession(options, session)
  } finally {
    session.dispose()
  }
}
