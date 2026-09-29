import { createToolingBinding } from '@master/css-binding/tooling'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSValidatorBatch
} from '@master/css-binding/tooling'
import { removedUtilityDiagnostics } from '../removed-utilities'
import { withCSSValueValidation } from '../value-validation'
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
  session: BindingValidatorSession,
  nativeClassNames: readonly string[] = []
): ValidatorSession {
  const nativeClasses = new Set(nativeClassNames)
  return {
    binding,
    generate(classNames) {
      const values = [...classNames]
      const candidates = session.nativeDeclarationCandidates(values) as import('@master/css-binding/tooling').MasterCSSNativeDeclarationCandidate[]
      const result = parse<MasterCSSValidatorBatch>(session.generateClassRules(values))
      return { ...result, classes: result.classes.map(result => withCSSValueValidation({ ...result, diagnostics: [...(nativeClasses.has(result.className) && !result.rules.length ? [] : result.diagnostics ?? []), ...(result.rules.length ? removedUtilityDiagnostics(result.className, candidates, nativeClasses) : [])] })) }
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
