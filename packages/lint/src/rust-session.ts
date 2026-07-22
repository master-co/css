import { readFile } from 'node:fs/promises'
import { loadNativeBinding } from '@master/css-native'
import { MASTER_CSS_LINT_BATCH_VERSION } from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import type {
  MasterCSSLintBatchIR,
  MasterCSSLintCanonicalClassSuggestionIR,
  MasterCSSLintCanonicalClassSuggestionsIR,
  MasterCSSLintClassListIR,
  MasterCSSLintClassConflictIR,
  MasterCSSLintDiagnosticIR,
  MasterCSSLintPartialClassConflictIR,
  MasterCSSLintRawValueCandidateIR,
  MasterCSSLintRawValueCandidatesIR,
  MasterCSSNativeDeclarationCandidateIR,
  MasterCSSValidatorBatchIR
} from '@master/css-schema/rust-contract'
import { cssTreeNativeDeclarationMatcher } from '@master/css-validator/native-declaration-matcher'
import validateCSS from '@master/css-validator/validate-css'
import type { MasterCSSLintDiagnostic, MasterCSSLintDiagnosticSeverity } from './diagnostics'
import type { RawValuePolicyOptions } from './find-unapproved-raw-value-classes'
import type { CanonicalClassNameOptions } from './suggest-canonical-class-name'

export type RustClassConflictIR = MasterCSSLintClassConflictIR
export type RustPartialClassConflictIR = MasterCSSLintPartialClassConflictIR
export type RustLintBatchIR = MasterCSSLintBatchIR

export interface RustLintSession {
  analyze(classNames: string[]): RustLintBatchIR
  canonicalClassNames(
    classNames: string[],
    options?: CanonicalClassNameOptions
  ): MasterCSSLintCanonicalClassSuggestionIR[]
  rawValueCandidates(classNames: string[]): MasterCSSLintRawValueCandidateIR[]
  analyzeClassList(
    classList: string,
    classNames: string[],
    options?: RustLintClassListOptions
  ): MasterCSSLintClassListIR
  dispose(): void
}

export interface RustLintClassListOptions {
  disallowUnknownClass?: boolean
  rawValuePolicy?: RawValuePolicyOptions
}

function resolveRawValuePolicy(
  candidates: MasterCSSLintRawValueCandidateIR[],
  options: RawValuePolicyOptions | undefined
) {
  if (!options) return
  if (options.allowRawValues) {
    return {
      allowRawValues: true,
      allowProperties: options.allowProperties || [],
      approvedSegments: []
    }
  }
  const patterns = options.allowedPatterns || []
  const allowProperties = options.allowProperties || []
  return {
    allowRawValues: false,
    allowProperties,
    approvedSegments: candidates.map(({ key, properties, segments }) =>
      allowProperties.includes(key) || properties.some((property) => allowProperties.includes(property))
        ? []
        : segments.map((segment) => patterns.some((pattern) => new RegExp(pattern).test(segment)))
    )
  }
}

function resolveValidation(batch: MasterCSSValidatorBatchIR) {
  const validationErrors = batch.classes.map(({ matched, rules }) => matched
    ? rules.flatMap(({ text }) => validateCSS(text).map((error) =>
      error.message || error.rawMessage || 'CSS validation failed'
    ))
    : [])
  return {
    validationErrors,
    invalidGeneratedClasses: batch.classes
      .filter((_, index) => validationErrors[index].length)
      .map(({ className }) => className)
  }
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
      ...resolveValidation(validation)
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
    canonicalClassNames(classNames, options) {
      const inputs = resolveInputs(classNames)
      return (JSON.parse(lint.canonicalClassNames(
        classNames,
        inputs.nativeSupport,
        options ? JSON.stringify(options) : undefined
      )) as MasterCSSLintCanonicalClassSuggestionsIR).suggestions
    },
    rawValueCandidates(classNames) {
      const inputs = resolveInputs(classNames)
      return (JSON.parse(lint.rawValueCandidates(
        classNames,
        inputs.nativeSupport,
        inputs.invalidGeneratedClasses
      )) as MasterCSSLintRawValueCandidatesIR).candidates
    },
    analyzeClassList(classList, classNames, options) {
      const inputs = resolveInputs(classNames)
      const rawValueCandidates = options?.rawValuePolicy && !options.rawValuePolicy.allowRawValues
        ? (JSON.parse(lint.rawValueCandidates(
          classNames,
          inputs.nativeSupport,
          inputs.invalidGeneratedClasses
        )) as MasterCSSLintRawValueCandidatesIR).candidates
        : []
      return JSON.parse(lint.analyzeClassListPolicy(JSON.stringify({
        version: MASTER_CSS_LINT_BATCH_VERSION,
        classList,
        classNames,
        nativeSupport: inputs.nativeSupport,
        invalidGeneratedClasses: inputs.invalidGeneratedClasses,
        validationErrors: inputs.validationErrors,
        disallowUnknownClass: options?.disallowUnknownClass,
        rawValuePolicy: resolveRawValuePolicy(rawValueCandidates, options?.rawValuePolicy)
      }))) as MasterCSSLintClassListIR
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
        resolveValidation(validation).invalidGeneratedClasses
      ) as RustLintBatchIR
    },
    canonicalClassNames(classNames, options) {
      const candidates = lint.nativeDeclarationCandidates(classNames) as MasterCSSNativeDeclarationCandidateIR[]
      const nativeSupport = candidates.map(cssTreeNativeDeclarationMatcher)
      return (lint.canonicalClassNames(
        classNames,
        nativeSupport.length ? nativeSupport : undefined,
        options
      ) as MasterCSSLintCanonicalClassSuggestionsIR).suggestions
    },
    rawValueCandidates(classNames) {
      const candidates = lint.nativeDeclarationCandidates(classNames) as MasterCSSNativeDeclarationCandidateIR[]
      const nativeSupport = candidates.map(cssTreeNativeDeclarationMatcher)
      const validation = validator.generateClasses(
        classNames,
        nativeSupport.length ? nativeSupport : undefined
      ) as MasterCSSValidatorBatchIR
      return (lint.rawValueCandidates(
        classNames,
        nativeSupport.length ? nativeSupport : undefined,
        resolveValidation(validation).invalidGeneratedClasses
      ) as MasterCSSLintRawValueCandidatesIR).candidates
    },
    analyzeClassList(classList, classNames, options) {
      const candidates = lint.nativeDeclarationCandidates(classNames) as MasterCSSNativeDeclarationCandidateIR[]
      const nativeSupport = candidates.map(cssTreeNativeDeclarationMatcher)
      const validation = validator.generateClasses(
        classNames,
        nativeSupport.length ? nativeSupport : undefined
      ) as MasterCSSValidatorBatchIR
      const resolvedValidation = resolveValidation(validation)
      const rawValueCandidates = options?.rawValuePolicy && !options.rawValuePolicy.allowRawValues
        ? (lint.rawValueCandidates(
          classNames,
          nativeSupport.length ? nativeSupport : undefined,
          resolvedValidation.invalidGeneratedClasses
        ) as MasterCSSLintRawValueCandidatesIR).candidates
        : []
      return lint.analyzeClassListPolicy(JSON.stringify({
        version: MASTER_CSS_LINT_BATCH_VERSION,
        classList,
        classNames,
        nativeSupport: nativeSupport.length ? nativeSupport : undefined,
        invalidGeneratedClasses: resolvedValidation.invalidGeneratedClasses,
        validationErrors: resolvedValidation.validationErrors,
        disallowUnknownClass: options?.disallowUnknownClass,
        rawValuePolicy: resolveRawValuePolicy(rawValueCandidates, options?.rawValuePolicy)
      })) as MasterCSSLintClassListIR
    },
    dispose() {
      lint.dispose()
      validator.dispose()
    }
  }
}
