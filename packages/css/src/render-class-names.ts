import { createRenderBackendSession } from '@master/css-backend/engine'
import {
  bindRenderSessionInternal,
  type MasterCSSRenderSessionOptions
} from './render-session'

export async function renderClassNames(
  classNames: readonly string[],
  options: MasterCSSRenderSessionOptions
) {
  const backend = await createRenderBackendSession(options)
  const session = bindRenderSessionInternal(
    {
      nativeDeclarationCandidates: (classNames) => backend.nativeDeclarationCandidates(classNames),
      ensureClasses: (classNames, nativeSupport) =>
        backend.ensureClassRules(classNames, nativeSupport),
      ensureStylesheetResources: (nativeCSS) => backend.ensureStylesheetResources(nativeCSS),
      emittedGlobals: () => backend.emittedGlobals(),
      snapshot: () => backend.snapshot(),
      snapshotForClasses: (classNames) => backend.snapshotForClassNames(classNames),
      dispose: () => backend.dispose()
    },
    options.supportsNativeDeclaration
  )
  try {
    return session.ensureClassRules(classNames)
  } finally {
    session.dispose()
  }
}
