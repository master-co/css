import { loadNativeBinding } from '@master/css-native'
import { MASTER_CSS_LINT_BATCH_VERSION } from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import type {
  MasterCSSLintBatchIR,
  MasterCSSLintCanonicalClassGroupSuggestionIR,
  MasterCSSLintCanonicalClassGroupSuggestionsIR,
  MasterCSSLintCanonicalClassSuggestionIR,
  MasterCSSLintCanonicalClassSuggestionsIR,
  MasterCSSLintCanonicalComposeDirectiveIR,
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
import type {
  CanonicalClassNameOptions,
  CanonicalComposeDirectiveResult,
  RawValuePolicyOptions
} from './contracts'

export type RustClassConflictIR = MasterCSSLintClassConflictIR
export type RustPartialClassConflictIR = MasterCSSLintPartialClassConflictIR
export type RustLintBatchIR = MasterCSSLintBatchIR

export interface LintSession {
  tokenizeClassList(classList: string, unescape?: string | false): {
    range: { start: number, end: number }
    raw: string
    token: string
  }[]
  analyzeDocument(source: string, languageId: string): {
    classPositions: {
      range: { start: number, end: number }
      contextRange: { start: number, end: number }
      raw: string
      token: string
    }[]
  }
  analyze(classNames: string[]): RustLintBatchIR
  canonicalClassGroups(
    classNames: string[],
    options?: CanonicalClassNameOptions
  ): MasterCSSLintCanonicalClassGroupSuggestionIR[]
  canonicalClassNames(
    classNames: string[],
    options?: CanonicalClassNameOptions
  ): MasterCSSLintCanonicalClassSuggestionIR[]
  canonicalComposeDirective(
    classNames: string[],
    options?: CanonicalClassNameOptions
  ): CanonicalComposeDirectiveResult | undefined
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
  canonicalOptions?: CanonicalClassNameOptions
  composeDirective?: boolean
}

function resolveRawValuePolicy(
  options: RawValuePolicyOptions | undefined
) {
  if (!options) return
  if (options.allowRawValues) {
    return {
      allowRawValues: true,
      allowProperties: options.allowProperties || [],
      allowedPatterns: []
    }
  }
  return {
    allowRawValues: false,
    allowProperties: options.allowProperties || [],
    allowedPatterns: options.allowedPatterns || []
  }
}

interface RustLintValidationIR {
  invalidGeneratedClasses: string[]
  validationErrors: string[][]
}

function collectHostRuleErrors(batch: MasterCSSValidatorBatchIR): string[][][] {
  return batch.classes.map(({ rules }) => rules.map(({ text }) =>
    validateCSS(text).map((error) =>
      error.message || error.rawMessage || 'CSS validation failed'
    )
  ))
}

export function createNativeLintSession(
  manifestJSON: string,
  options: { required?: boolean } = {}
): LintSession | undefined {
  const loaded = loadNativeBinding({ required: options.required })
  if (!loaded) return
  const lint = new loaded.binding.LintSession(manifestJSON)
  const validator = new loaded.binding.ValidatorSession(manifestJSON)
  const language = new loaded.binding.LanguageSession(manifestJSON)
  const resolveInputs = (classNames: string[]) => {
    const candidates = JSON.parse(
      lint.nativeDeclarationCandidates(classNames)
    ) as MasterCSSNativeDeclarationCandidateIR[]
    const nativeSupport = candidates.map(cssTreeNativeDeclarationMatcher)
    const validation = JSON.parse(validator.generateClasses(
      classNames,
      nativeSupport.length ? nativeSupport : undefined
    )) as MasterCSSValidatorBatchIR
    const resolvedValidation = JSON.parse(lint.resolveValidation(
      JSON.stringify(validation),
      JSON.stringify(collectHostRuleErrors(validation))
    )) as RustLintValidationIR
    return {
      nativeSupport: nativeSupport.length ? nativeSupport : undefined,
      ...resolvedValidation
    }
  }
  return {
    tokenizeClassList(classList, unescape) {
      return (JSON.parse(language.analyzeDocument(JSON.stringify({
        source: classList,
        languageId: 'class-list',
        hostRanges: [{
          start: 0,
          end: classList.length,
          unescape: unescape ? [unescape] : []
        }]
      }))) as ReturnType<LintSession['analyzeDocument']>).classPositions
    },
    analyzeDocument(source, languageId) {
      return JSON.parse(language.analyzeDocument(JSON.stringify({ source, languageId })))
    },
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
    canonicalClassGroups(classNames, options) {
      const inputs = resolveInputs(classNames)
      return (JSON.parse(lint.canonicalClassGroups(
        classNames,
        inputs.nativeSupport,
        options ? JSON.stringify(options) : undefined
      )) as MasterCSSLintCanonicalClassGroupSuggestionsIR).suggestions
    },
    canonicalComposeDirective(classNames, options) {
      const inputs = resolveInputs(classNames)
      const result = JSON.parse(lint.canonicalComposeDirective(
        classNames,
        inputs.nativeSupport,
        options ? JSON.stringify(options) : undefined
      )) as MasterCSSLintCanonicalComposeDirectiveIR
      const { version: _, ...compose } = result
      return compose.suggestions.length ? compose : undefined
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
      return JSON.parse(lint.analyzeClassListPolicy(JSON.stringify({
        version: MASTER_CSS_LINT_BATCH_VERSION,
        classList,
        classNames,
        nativeSupport: inputs.nativeSupport,
        invalidGeneratedClasses: inputs.invalidGeneratedClasses,
        validationErrors: inputs.validationErrors,
        disallowUnknownClass: options?.disallowUnknownClass,
        canonicalOptions: options?.canonicalOptions,
        composeDirective: options?.composeDirective,
        rawValuePolicy: resolveRawValuePolicy(options?.rawValuePolicy)
      }))) as MasterCSSLintClassListIR
    },
    dispose() {
      lint.dispose()
      validator.dispose()
      language.dispose()
    }
  }
}

export function fromRustLintDiagnostics(
  diagnostics: MasterCSSLintDiagnosticIR[],
  severity: MasterCSSLintDiagnosticSeverity = 'warning'
): MasterCSSLintDiagnostic[] {
  return diagnostics.map((diagnostic) => ({
    ...diagnostic,
    severity,
    fix: diagnostic.fix
  }))
}

export async function createLintSession(manifest: MasterCSSManifest): Promise<LintSession> {
  const manifestJSON = stringifyMasterCSSManifestJSON(manifest)
  const native = createNativeLintSession(manifestJSON)
  if (native) return native

  const { createToolingLanguageSession, createToolingLintSession, createToolingValidatorSession } = await import('@master/css-wasm-tooling')
  const [lint, validator, language] = await Promise.all([
    createToolingLintSession(manifestJSON),
    createToolingValidatorSession(manifestJSON),
    createToolingLanguageSession(manifestJSON)
  ])
  const resolveInputs = (classNames: string[]) => {
    const candidates = lint.nativeDeclarationCandidates(classNames) as MasterCSSNativeDeclarationCandidateIR[]
    const nativeSupport = candidates.map(cssTreeNativeDeclarationMatcher)
    const validation = validator.generateClasses(
      classNames,
      nativeSupport.length ? nativeSupport : undefined
    ) as MasterCSSValidatorBatchIR
    const resolvedValidation = lint.resolveValidation(
      validation,
      collectHostRuleErrors(validation)
    ) as RustLintValidationIR
    return {
      nativeSupport: nativeSupport.length ? nativeSupport : undefined,
      ...resolvedValidation
    }
  }
  return {
    tokenizeClassList(classList, unescape) {
      return (language.analyzeDocument({
        source: classList,
        languageId: 'class-list',
        hostRanges: [{
          start: 0,
          end: classList.length,
          unescape: unescape ? [unescape] : []
        }]
      }) as ReturnType<LintSession['analyzeDocument']>).classPositions
    },
    analyzeDocument(source, languageId) {
      return language.analyzeDocument({ source, languageId }) as ReturnType<LintSession['analyzeDocument']>
    },
    analyze(classNames) {
      const inputs = resolveInputs(classNames)
      return lint.analyze(
        classNames,
        inputs.nativeSupport,
        inputs.invalidGeneratedClasses
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
    canonicalClassGroups(classNames, options) {
      const candidates = lint.nativeDeclarationCandidates(classNames) as MasterCSSNativeDeclarationCandidateIR[]
      const nativeSupport = candidates.map(cssTreeNativeDeclarationMatcher)
      return (lint.canonicalClassGroups(
        classNames,
        nativeSupport.length ? nativeSupport : undefined,
        options
      ) as MasterCSSLintCanonicalClassGroupSuggestionsIR).suggestions
    },
    canonicalComposeDirective(classNames, options) {
      const candidates = lint.nativeDeclarationCandidates(classNames) as MasterCSSNativeDeclarationCandidateIR[]
      const nativeSupport = candidates.map(cssTreeNativeDeclarationMatcher)
      const result = lint.canonicalComposeDirective(
        classNames,
        nativeSupport.length ? nativeSupport : undefined,
        options
      ) as MasterCSSLintCanonicalComposeDirectiveIR
      const { version: _, ...compose } = result
      return compose.suggestions.length ? compose : undefined
    },
    rawValueCandidates(classNames) {
      const inputs = resolveInputs(classNames)
      return (lint.rawValueCandidates(
        classNames,
        inputs.nativeSupport,
        inputs.invalidGeneratedClasses
      ) as MasterCSSLintRawValueCandidatesIR).candidates
    },
    analyzeClassList(classList, classNames, options) {
      const inputs = resolveInputs(classNames)
      return lint.analyzeClassListPolicy(JSON.stringify({
        version: MASTER_CSS_LINT_BATCH_VERSION,
        classList,
        classNames,
        nativeSupport: inputs.nativeSupport,
        invalidGeneratedClasses: inputs.invalidGeneratedClasses,
        validationErrors: inputs.validationErrors,
        disallowUnknownClass: options?.disallowUnknownClass,
        canonicalOptions: options?.canonicalOptions,
        composeDirective: options?.composeDirective,
        rawValuePolicy: resolveRawValuePolicy(options?.rawValuePolicy)
      })) as MasterCSSLintClassListIR
    },
    dispose() {
      lint.dispose()
      validator.dispose()
      language.dispose()
    }
  }
}
