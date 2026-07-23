import { loadNativeToolingBackend } from '@master/css-backend/tooling'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSLintCanonicalClassGroupSuggestionsIR,
  MasterCSSLintCanonicalClassSuggestionsIR,
  MasterCSSLintCanonicalComposeDirectiveIR,
  MasterCSSLintRawValueCandidatesIR,
  MasterCSSNativeDeclarationCandidateIR,
  MasterCSSValidatorBatchIR
} from '@master/css-backend/tooling'
import { MASTER_CSS_LINT_BATCH_VERSION } from '@master/css-backend/tooling'
import { supportsNativeDeclaration } from '../host'
import { validateCSS } from '../css'
import type {
  CanonicalClassNameOptions,
  CanonicalComposeDirectiveResult,
  RawValuePolicyOptions
} from './contracts'
import type {
  MasterCSSLintAnalysis,
  MasterCSSLintCanonicalClassGroupSuggestion,
  MasterCSSLintCanonicalClassSuggestion,
  MasterCSSLintClassListAnalysis,
  MasterCSSLintClassListOptions,
  MasterCSSLintDocumentAnalysis,
  MasterCSSLintRawValueCandidate,
  MasterCSSLintToken
} from './analysis'

export interface LintSession {
  tokenizeClassList(classList: string, unescape?: string | false): readonly MasterCSSLintToken[]
  analyzeDocument(source: string, languageId: string): MasterCSSLintDocumentAnalysis
  analyze(classNames: string[]): MasterCSSLintAnalysis
  canonicalClassGroups(
    classNames: string[],
    options?: CanonicalClassNameOptions
  ): readonly MasterCSSLintCanonicalClassGroupSuggestion[]
  canonicalClassNames(
    classNames: string[],
    options?: CanonicalClassNameOptions
  ): readonly MasterCSSLintCanonicalClassSuggestion[]
  canonicalComposeDirective(
    classNames: string[],
    options?: CanonicalClassNameOptions
  ): CanonicalComposeDirectiveResult | undefined
  rawValueCandidates(classNames: string[]): readonly MasterCSSLintRawValueCandidate[]
  analyzeClassList(
    classList: string,
    classNames: string[],
    options?: MasterCSSLintClassListOptions
  ): MasterCSSLintClassListAnalysis
  dispose(): void
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

interface BackendLintValidation {
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
  manifest: MasterCSSManifest,
  options: { required?: boolean } = {}
): LintSession | undefined {
  const tooling = loadNativeToolingBackend({ required: options.required })
  if (!tooling) return
  const lint = tooling.createLintSession(manifest)
  const validator = tooling.createValidatorSession(manifest)
  const language = tooling.createLanguageSession(manifest)
  const resolveInputs = (classNames: string[]) => {
    const candidates = lint.nativeDeclarationCandidates(
      classNames
    ) as MasterCSSNativeDeclarationCandidateIR[]
    const nativeSupport = candidates.map(supportsNativeDeclaration)
    const validation = validator.generateClassRules(
      classNames,
      nativeSupport.length ? nativeSupport : undefined
    ) as MasterCSSValidatorBatchIR
    const resolvedValidation = lint.resolveValidation(
      validation,
      collectHostRuleErrors(validation)
    ) as BackendLintValidation
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
      ) as MasterCSSLintAnalysis
    },
    canonicalClassNames(classNames, options) {
      const inputs = resolveInputs(classNames)
      return (lint.canonicalClassNames(
        classNames,
        inputs.nativeSupport,
        options
      ) as MasterCSSLintCanonicalClassSuggestionsIR).suggestions
    },
    canonicalClassGroups(classNames, options) {
      const inputs = resolveInputs(classNames)
      return (lint.canonicalClassGroups(
        classNames,
        inputs.nativeSupport,
        options
      ) as MasterCSSLintCanonicalClassGroupSuggestionsIR).suggestions
    },
    canonicalComposeDirective(classNames, options) {
      const inputs = resolveInputs(classNames)
      const result = lint.canonicalComposeDirective(
        classNames,
        inputs.nativeSupport,
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
      return lint.analyzeClassListPolicy({
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
      }) as MasterCSSLintClassListAnalysis
    },
    dispose() {
      lint.dispose()
      validator.dispose()
      language.dispose()
    }
  }
}

export async function createLintSession(
  manifest: MasterCSSManifest,
  options: { readonly backend?: 'auto' | 'native' | 'wasm' } = {}
): Promise<LintSession> {
  const manifestJSON = serializeMasterCSSManifest(manifest)
  if (options.backend !== 'wasm') {
    const native = createNativeLintSession(manifest, {
      required: options.backend === 'native'
    })
    if (native) return native
  }

  const { createToolingLanguageSession, createToolingLintSession, createToolingValidatorSession } = await import('@master/css-wasm-tooling')
  const [lint, validator, language] = await Promise.all([
    createToolingLintSession(manifestJSON),
    createToolingValidatorSession(manifestJSON),
    createToolingLanguageSession(manifestJSON)
  ])
  const resolveInputs = (classNames: string[]) => {
    const candidates = lint.nativeDeclarationCandidates(classNames) as MasterCSSNativeDeclarationCandidateIR[]
    const nativeSupport = candidates.map(supportsNativeDeclaration)
    const validation = validator.generateClasses(
      classNames,
      nativeSupport.length ? nativeSupport : undefined
    ) as MasterCSSValidatorBatchIR
    const resolvedValidation = lint.resolveValidation(
      validation,
      collectHostRuleErrors(validation)
    ) as BackendLintValidation
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
      ) as MasterCSSLintAnalysis
    },
    canonicalClassNames(classNames, options) {
      const candidates = lint.nativeDeclarationCandidates(classNames) as MasterCSSNativeDeclarationCandidateIR[]
      const nativeSupport = candidates.map(supportsNativeDeclaration)
      return (lint.canonicalClassNames(
        classNames,
        nativeSupport.length ? nativeSupport : undefined,
        options
      ) as MasterCSSLintCanonicalClassSuggestionsIR).suggestions
    },
    canonicalClassGroups(classNames, options) {
      const candidates = lint.nativeDeclarationCandidates(classNames) as MasterCSSNativeDeclarationCandidateIR[]
      const nativeSupport = candidates.map(supportsNativeDeclaration)
      return (lint.canonicalClassGroups(
        classNames,
        nativeSupport.length ? nativeSupport : undefined,
        options
      ) as MasterCSSLintCanonicalClassGroupSuggestionsIR).suggestions
    },
    canonicalComposeDirective(classNames, options) {
      const candidates = lint.nativeDeclarationCandidates(classNames) as MasterCSSNativeDeclarationCandidateIR[]
      const nativeSupport = candidates.map(supportsNativeDeclaration)
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
      })) as MasterCSSLintClassListAnalysis
    },
    dispose() {
      lint.dispose()
      validator.dispose()
      language.dispose()
    }
  }
}
