import { loadNativeBinding } from '@master/css-native'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import type {
  MasterCSSNativeDeclarationCandidateIR,
  MasterCSSValidatorBatchIR
} from '@master/css-schema/rust-contract'
import { createToolingValidatorSession } from '@master/css-wasm-tooling'
import { cssTreeNativeDeclarationMatcher } from './native-declaration-matcher'

interface BackendValidatorSession {
  nativeDeclarationCandidates(classNames: string[]): unknown
  generateClasses(classNames: string[], nativeSupport?: boolean[]): unknown
  dispose(): void
}

export interface ValidatorSession {
  readonly backend: 'native' | 'wasm'
  generate(classNames: readonly string[]): MasterCSSValidatorBatchIR
  dispose(): void
}

function parse<T>(value: unknown): T {
  return typeof value === 'string' ? JSON.parse(value) as T : value as T
}

export function bindValidatorSession(
  backend: ValidatorSession['backend'],
  session: BackendValidatorSession
): ValidatorSession {
  return {
    backend,
    generate(classNames) {
      const values = [...classNames]
      const candidates = parse<MasterCSSNativeDeclarationCandidateIR[]>(
        session.nativeDeclarationCandidates(values)
      )
      const nativeSupport = candidates.map(cssTreeNativeDeclarationMatcher)
      return parse<MasterCSSValidatorBatchIR>(
        session.generateClasses(values, nativeSupport.length ? nativeSupport : undefined)
      )
    },
    dispose: () => session.dispose()
  }
}

export async function createValidator(manifest: MasterCSSManifest): Promise<ValidatorSession> {
  const manifestJSON = stringifyMasterCSSManifestJSON(manifest)
  const loaded = loadNativeBinding()
  if (loaded) {
    return bindValidatorSession('native', new loaded.binding.ValidatorSession(manifestJSON))
  }
  return bindValidatorSession('wasm', await createToolingValidatorSession(manifestJSON))
}
