import { loadNativeBinding } from '@master/css-native'
import type { MasterCSSGeneratedRuleIR } from '@master/css-schema/hydration-manifest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import type {
  MasterCSSNativeDeclarationCandidateIR,
  MasterCSSValidatorBatchIR
} from '@master/css-schema/rust-contract'
import { cssTreeNativeDeclarationMatcher } from './native-declaration-matcher'

export interface RustValidatorSession {
  generate(classNames: string[]): MasterCSSValidatorBatchIR
  dispose(): void
}

export function createRustValidatorSession(manifest: MasterCSSManifest): RustValidatorSession {
  const loaded = loadNativeBinding({ required: true })!
  const session = new loaded.binding.ValidatorSession(stringifyMasterCSSManifestJSON(manifest))
  return {
    generate(classNames) {
      const candidates = JSON.parse(
        session.nativeDeclarationCandidates(classNames)
      ) as MasterCSSNativeDeclarationCandidateIR[]
      const support = candidates.map(cssTreeNativeDeclarationMatcher)
      return JSON.parse(
        session.generateClasses(classNames, support.length ? support : undefined)
      ) as MasterCSSValidatorBatchIR
    },
    dispose: () => session.dispose()
  }
}

export function generateRustRules(
  syntax: string,
  session: RustValidatorSession
): MasterCSSGeneratedRuleIR[] {
  return session.generate([syntax]).classes[0]?.rules ?? []
}
