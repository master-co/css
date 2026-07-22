import { MasterCSS } from '@master/css'
import type { MasterCSSOptions, MasterCSSManifest, MasterCSSEmittedGlobals } from '@master/css'
import { cssTreeNativeDeclarationMatcher } from './native-declaration-matcher'

export { cssTreeNativeDeclarationMatcher } from './native-declaration-matcher'

export function createCSSWithNativeDeclarations(
  manifest: MasterCSSManifest,
  emittedGlobals?: MasterCSSEmittedGlobals,
  options: MasterCSSOptions = {}
) {
  return MasterCSS.create({
    manifest,
    emittedGlobals,
    ...options,
    nativeDeclarationMatcher: options.nativeDeclarationMatcher || cssTreeNativeDeclarationMatcher
  })
}
