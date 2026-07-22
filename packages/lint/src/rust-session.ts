import { readFile } from 'node:fs/promises'
import { loadNativeBinding } from '@master/css-native'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import type {
  MasterCSSLintBatchIR,
  MasterCSSLintClassListIR,
  MasterCSSLintClassConflictIR,
  MasterCSSLintDiagnosticIR,
  MasterCSSLintPartialClassConflictIR,
  MasterCSSNativeDeclarationCandidateIR,
  MasterCSSValidatorBatchIR
} from '@master/css-schema/rust-contract'
import { cssTreeNativeDeclarationMatcher } from '@master/css-validator/native-declaration-matcher'
import validateCSS from '@master/css-validator/validate-css'
import type { MasterCSSLintDiagnostic, MasterCSSLintDiagnosticSeverity } from './diagnostics'

export type RustClassConflictIR = MasterCSSLintClassConflictIR
export type RustPartialClassConflictIR = MasterCSSLintPartialClassConflictIR
export type RustLintBatchIR = MasterCSSLintBatchIR

export interface RustLintSession {
  analyze(classNames: string[]): RustLintBatchIR
  analyzeClassList(classList: string, classNames: string[]): MasterCSSLintClassListIR
  dispose(): void
}

function invalidGeneratedClasses(batch: MasterCSSValidatorBatchIR) {
  return batch.classes
    .filter(({ matched, rules }) => matched && rules.some(({ text }) => validateCSS(text).length))
    .map(({ className }) => className)
}

function createNativeRustLintSession(manifestJSON: string): RustLintSession | undefined {
  const loaded = loadNativeBinding()
  if (!loaded) return
  const lint = new loaded.binding.LintSession(manifestJSON)
  const validator = new loaded.binding.ValidatorSession(manifestJSON)
  const resolveInputs = (classNames: string[]) => {
    const candidates = JSON.parse(
      lint.nativeDeclarationCandidates(classNames)
    ) as MasterCSSNativeDeclarationCandidateIR[]
    const nativeSupport = candidates.map(cssTreeNativeDeclarationMatcher)
    const validation = JSON.parse(validator.generateClasses(
      classNames,
      nativeSupport.length ? nativeSupport : undefined
    )) as MasterCSSValidatorBatchIR
    return {
      nativeSupport: nativeSupport.length ? nativeSupport : undefined,
      invalidGeneratedClasses: invalidGeneratedClasses(validation)
    }
  }
  return {
    analyze(classNames) {
      const inputs = resolveInputs(classNames)
      return JSON.parse(lint.analyze(
        classNames,
        inputs.nativeSupport,
        inputs.invalidGeneratedClasses
      )) as RustLintBatchIR
    },
    analyzeClassList(classList, classNames) {
      const inputs = resolveInputs(classNames)
      return JSON.parse(lint.analyzeClassList(
        classList,
        classNames,
        inputs.nativeSupport,
        inputs.invalidGeneratedClasses
      )) as MasterCSSLintClassListIR
    },
    dispose() {
      lint.dispose()
      validator.dispose()
    }
  }
}

export function createRustLintSessionSync(manifest: MasterCSSManifest): RustLintSession | undefined {
  return createNativeRustLintSession(stringifyMasterCSSManifestJSON(manifest))
}

export function fromRustLintDiagnostics(
  diagnostics: MasterCSSLintDiagnosticIR[],
  severity: MasterCSSLintDiagnosticSeverity = 'warning'
): MasterCSSLintDiagnostic[] {
  return diagnostics.map((diagnostic) => ({
    ...diagnostic,
    severity,
    fix: diagnostic.fix && {
      ...diagnostic.fix,
      scope: 'class-list'
    }
  }))
}

export async function createRustLintSession(manifest: MasterCSSManifest): Promise<RustLintSession> {
  const manifestJSON = stringifyMasterCSSManifestJSON(manifest)
  const native = createNativeRustLintSession(manifestJSON)
  if (native) return native

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
    analyzeClassList(classList, classNames) {
      const candidates = lint.nativeDeclarationCandidates(classNames) as MasterCSSNativeDeclarationCandidateIR[]
      const nativeSupport = candidates.map(cssTreeNativeDeclarationMatcher)
      const validation = validator.generateClasses(
        classNames,
        nativeSupport.length ? nativeSupport : undefined
      ) as MasterCSSValidatorBatchIR
      return lint.analyzeClassList(
        classList,
        classNames,
        nativeSupport.length ? nativeSupport : undefined,
        invalidGeneratedClasses(validation)
      ) as MasterCSSLintClassListIR
    },
    dispose() {
      lint.dispose()
      validator.dispose()
    }
  }
}
