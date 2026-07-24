import { createRenderBindingSession } from '@master/css-binding/engine'
import {
  bindRenderSessionInternal,
  type MasterCSSRenderSessionOptions
} from './render-session'

export async function renderClassNames(
  classNames: readonly string[],
  options: MasterCSSRenderSessionOptions
) {
  const binding = await createRenderBindingSession(options)
  const session = bindRenderSessionInternal(
    {
      nativeDeclarationCandidates: (classNames) => binding.nativeDeclarationCandidates(classNames),
      ensureClasses: (classNames, nativeSupport) =>
        binding.ensureClassRules(classNames, nativeSupport),
      ensureStylesheetResources: (nativeCSS) => binding.ensureStylesheetResources(nativeCSS),
      emittedGlobals: () => binding.emittedGlobals(),
      snapshot: () => binding.snapshot(),
      snapshotForClasses: (classNames) => binding.snapshotForClassNames(classNames),
      dispose: () => binding.dispose()
    },
    options.supportsNativeDeclaration
  )
  try {
    return session.ensureClassRules(classNames)
  } finally {
    session.dispose()
  }
}
