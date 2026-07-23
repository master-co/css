import type * as NativeModule from '@master/css-backend/engine'
import { createWasmRenderSession } from '@master/css-wasm-engine'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import {
  MasterCSSRenderSession,
  bindRenderSessionInternal,
  type BackendRenderSession,
  type MasterCSSRenderSessionOptions
} from './render-session'

export async function renderClassNames(
  classNames: readonly string[],
  options: MasterCSSRenderSessionOptions
) {
  if (typeof process !== 'undefined') {
    const { createNativeRenderSession } = await import('@master/css-backend/engine') as typeof NativeModule
    const native = createNativeRenderSession(options)
    if (native) {
      const session = bindRenderSessionInternal(
        {
          nativeDeclarationCandidates: (classNames) => native.nativeDeclarationCandidates(classNames),
          ensureClasses: (classNames, nativeSupport) =>
            native.ensureClassRules(classNames, nativeSupport ? [...nativeSupport] : undefined),
          ensureStylesheetResources: (nativeCSS) => native.ensureStylesheetResources(nativeCSS),
          emittedGlobals: () => native.emittedGlobals(),
          snapshot: () => native.snapshot(),
          snapshotForClasses: (classNames) => native.snapshotForClassNames(classNames),
          dispose: () => native.dispose()
        },
        options.supportsNativeDeclaration
      )
      try {
        return session.ensureClassRules(classNames)
      } finally {
        session.dispose()
      }
    }
  }
  const backend = await createWasmRenderSession(
    serializeMasterCSSManifest(options.manifest),
    { emittedGlobals: options.emittedGlobals }
  )
  const session = bindRenderSessionInternal(
    backend as unknown as BackendRenderSession,
    options.supportsNativeDeclaration
  )
  try {
    return session.ensureClassRules(classNames)
  } finally {
    session.dispose()
  }
}
