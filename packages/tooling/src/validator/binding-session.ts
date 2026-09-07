import { createToolingBinding } from '@master/css-binding/tooling'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSNativeDeclarationCandidate,
  MasterCSSValidatorBatch
} from '@master/css-binding/tooling'
import { supportsNativeDeclaration } from '../host'
import type { MasterCSSClassValidationResult } from './contracts'

interface BindingValidatorSession {
  nativeDeclarationCandidates(classNames: string[]): unknown
  generateClassRules(classNames: string[], nativeSupport?: boolean[]): unknown
  dispose(): void
}

export interface ValidatorSession {
  readonly binding: 'native' | 'wasm'
  generate(classNames: readonly string[]): MasterCSSClassValidationResult
  dispose(): void
}

function parse<T>(value: unknown): T {
  return value as T
}

export function bindValidatorSession(
  binding: ValidatorSession['binding'],
  session: BindingValidatorSession
): ValidatorSession {
  return {
    binding,
    generate(classNames) {
      const values = [...classNames]
      const candidates = parse<MasterCSSNativeDeclarationCandidate[]>(
        session.nativeDeclarationCandidates(values)
      )
      const nativeSupport = candidates.map(supportsNativeDeclaration)
      return parse<MasterCSSValidatorBatch>(
        session.generateClassRules(values, nativeSupport.length ? nativeSupport : undefined)
      )
    },
    dispose: () => session.dispose()
  }
}

export async function createValidator(
  manifest: MasterCSSManifest,
  options: { readonly binding?: 'auto' | 'native' | 'wasm' } = {}
): Promise<ValidatorSession> {
  const tooling = await createToolingBinding({ binding: options.binding })
  return bindValidatorSession(
    tooling.binding,
    await tooling.createValidatorSession(manifest)
  )
}
