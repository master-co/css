import { readFile } from 'node:fs/promises'
import { loadNativeBinding } from '@master/css-native'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import type {
  MasterCSSLintBatchIR,
  MasterCSSLintClassConflictIR,
  MasterCSSLintPartialClassConflictIR,
  MasterCSSNativeDeclarationCandidateIR,
  MasterCSSValidatorBatchIR
} from '@master/css-schema/rust-contract'
import { cssTreeNativeDeclarationMatcher } from '@master/css-validator/native-declaration-matcher'
import validateCSS from '@master/css-validator/validate-css'

export type RustClassConflictIR = MasterCSSLintClassConflictIR
export type RustPartialClassConflictIR = MasterCSSLintPartialClassConflictIR
export type RustLintBatchIR = MasterCSSLintBatchIR

export interface RustLintSession {
  analyze(classNames: string[]): RustLintBatchIR
  dispose(): void
}

function invalidGeneratedClasses(batch: MasterCSSValidatorBatchIR) {
  return batch.classes
    .filter(({ matched, rules }) => matched && rules.some(({ text }) => validateCSS(text).length))
    .map(({ className }) => className)
}

export async function createRustLintSession(manifest: MasterCSSManifest): Promise<RustLintSession> {
  const manifestJSON = stringifyMasterCSSManifestJSON(manifest)
  const loaded = loadNativeBinding()
  if (loaded) {
    const lint = new loaded.binding.LintSession(manifestJSON)
    const validator = new loaded.binding.ValidatorSession(manifestJSON)
    return {
      analyze(classNames) {
        const candidates = JSON.parse(
          lint.nativeDeclarationCandidates(classNames)
        ) as MasterCSSNativeDeclarationCandidateIR[]
        const nativeSupport = candidates.map(cssTreeNativeDeclarationMatcher)
        const validation = JSON.parse(validator.generateClasses(
          classNames,
          nativeSupport.length ? nativeSupport : undefined
        )) as MasterCSSValidatorBatchIR
        return JSON.parse(lint.analyze(
          classNames,
          nativeSupport.length ? nativeSupport : undefined,
          invalidGeneratedClasses(validation)
        )) as RustLintBatchIR
      },
      dispose() {
        lint.dispose()
        validator.dispose()
      }
    }
  }

  const [{ createToolingLintSession, createToolingValidatorSession }, wasmBytes] = await Promise.all([
    import('@master/css-wasm-tooling'),
    readFile(new URL(import.meta.resolve('@master/css-wasm-tooling/wasm')))
  ])
  const input = new Uint8Array(wasmBytes)
  const [lint, validator] = await Promise.all([
    createToolingLintSession(manifestJSON, { input }),
    createToolingValidatorSession(manifestJSON, { input })
  ])
  return {
    analyze(classNames) {
      const candidates = lint.nativeDeclarationCandidates(classNames) as MasterCSSNativeDeclarationCandidateIR[]
      const nativeSupport = candidates.map(cssTreeNativeDeclarationMatcher)
      const validation = validator.generateClasses(
        classNames,
        nativeSupport.length ? nativeSupport : undefined
      ) as MasterCSSValidatorBatchIR
      return lint.analyze(
        classNames,
        nativeSupport.length ? nativeSupport : undefined,
        invalidGeneratedClasses(validation)
      ) as RustLintBatchIR
    },
    dispose() {
      lint.dispose()
      validator.dispose()
    }
  }
}
