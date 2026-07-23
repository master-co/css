import { loadNativeToolingBackend } from '@master/css-backend/tooling'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSNativeDeclarationCandidateIR,
  MasterCSSValidatorBatchIR
} from '@master/css-backend/tooling'
import { createToolingValidatorSession } from '@master/css-wasm-tooling'
import { supportsNativeDeclaration } from '../host'
import type { MasterCSSClassValidationResult } from './contracts'

interface BackendValidatorSession {
  nativeDeclarationCandidates(classNames: string[]): unknown
  generateClasses(classNames: string[], nativeSupport?: boolean[]): unknown
  dispose(): void
}

export interface ValidatorSession {
  readonly backend: 'native' | 'wasm'
  generate(classNames: readonly string[]): MasterCSSClassValidationResult
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
      const nativeSupport = candidates.map(supportsNativeDeclaration)
      return parse<MasterCSSValidatorBatchIR>(
        session.generateClasses(values, nativeSupport.length ? nativeSupport : undefined)
      )
    },
    dispose: () => session.dispose()
  }
}

export async function createValidator(
  manifest: MasterCSSManifest,
  options: { readonly backend?: 'auto' | 'native' | 'wasm' } = {}
): Promise<ValidatorSession> {
  const manifestJSON = serializeMasterCSSManifest(manifest)
  if (options.backend !== 'wasm') {
    const tooling = loadNativeToolingBackend({ required: options.backend === 'native' })
    if (tooling) {
      const session = tooling.createValidatorSession(manifest)
      return bindValidatorSession('native', {
        nativeDeclarationCandidates: (classNames) =>
          session.nativeDeclarationCandidates(classNames),
        generateClasses: (classNames, nativeSupport) =>
          session.generateClassRules(classNames, nativeSupport),
        dispose: () => session.dispose()
      })
    }
  }
  return bindValidatorSession('wasm', await createToolingValidatorSession(manifestJSON))
}
