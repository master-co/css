import { createToolingBackend } from '@master/css-backend/tooling'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSNativeDeclarationCandidate,
  MasterCSSValidatorBatch
} from '@master/css-backend/tooling'
import { supportsNativeDeclaration } from '../host'
import type { MasterCSSClassValidationResult } from './contracts'

interface BackendValidatorSession {
  nativeDeclarationCandidates(classNames: string[]): unknown
  generateClassRules(classNames: string[], nativeSupport?: boolean[]): unknown
  dispose(): void
}

export interface ValidatorSession {
  readonly backend: 'native' | 'wasm'
  generate(classNames: readonly string[]): MasterCSSClassValidationResult
  dispose(): void
}

function parse<T>(value: unknown): T {
  return value as T
}

export function bindValidatorSession(
  backend: ValidatorSession['backend'],
  session: BackendValidatorSession
): ValidatorSession {
  return {
    backend,
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
  options: { readonly backend?: 'auto' | 'native' | 'wasm' } = {}
): Promise<ValidatorSession> {
  const tooling = await createToolingBackend({ backend: options.backend })
  return bindValidatorSession(
    tooling.backend,
    await tooling.createValidatorSession(manifest)
  )
}
