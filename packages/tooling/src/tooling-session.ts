import {
  createToolingBinding
} from '@master/css-binding/tooling'
import type { MasterCSSBinding } from '@master/css-binding'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  bindLexerSession,
  type LexerSession
} from './lexer/session'
import type {
  MasterCSSClassListAnalysis,
  MasterCSSClassListAnalysisRequest
} from './lexer/contracts'
import {
  bindLanguageSession,
  type LanguageSession
} from './language/session'
import {
  bindLintSession,
  type LintSession
} from './lint/binding-session'
import type {
  MasterCSSLintAnalysis,
  MasterCSSLintCanonicalClassGroupSuggestion,
  MasterCSSLintCanonicalClassSuggestion,
  MasterCSSLintClassListAnalysis,
  MasterCSSLintClassListOptions,
  MasterCSSLintDocumentAnalysis,
  MasterCSSLintRawValueCandidate,
  MasterCSSLintToken
} from './lint/analysis'
import {
  bindSourceExtractor,
  type SourceExtractor
} from './source/session'
import type {
  MasterCSSSourceExtraction,
  MasterCSSSourceExtractionRequest
} from './source/contracts'
import {
  bindValidatorSession,
  type ValidatorSession
} from './validator/binding-session'
import type { MasterCSSClassValidationResult } from './validator/contracts'
import type { CanonicalClassNameOptions } from './lint/contracts'
import type {
  MasterCSSDocumentAnalysis,
  MasterCSSDocumentAnalysisRequest,
  MasterCSSFormatDirectivesRequest,
  MasterCSSFormatDirectivesResult,
  MasterCSSLanguageClassifications,
  MasterCSSLanguageColorCandidate,
  MasterCSSLanguageColorPresentation,
  MasterCSSLanguageColorTokens,
  MasterCSSLanguageCompletionIndex,
  MasterCSSLanguageInspection
} from './language/contracts'
import { freezeToolingResult } from './immutable'

export interface ToolingSessionParts {
  readonly lexer: LexerSession
  readonly source: SourceExtractor
  readonly validator: ValidatorSession
  readonly lint: LintSession
  readonly language: LanguageSession
}

let bindToolingSession: (parts: ToolingSessionParts) => MasterCSSToolingSession

export interface MasterCSSToolingSessionOptions {
  readonly manifest: MasterCSSManifest
  readonly binding?: MasterCSSBinding
}

export class MasterCSSToolingSession implements Disposable {
  private disposed = false

  private constructor(private readonly parts: ToolingSessionParts) { }

  get binding(): 'native' | 'wasm' {
    this.assertActive()
    return this.parts.language.binding
  }

  analyzeClassList(request: MasterCSSClassListAnalysisRequest): MasterCSSClassListAnalysis {
    this.assertActive()
    return freezeToolingResult(this.parts.lexer.analyze({
      classLists: request.classLists?.map((input) => ({
        source: input.source,
        ...(input.unescape ? { unescape: [...input.unescape] } : {})
      })),
      cssSources: request.cssSources ? [...request.cssSources] : undefined,
      escapeIdentifiers: request.escapeIdentifiers ? [...request.escapeIdentifiers] : undefined
    }))
  }

  extractSource(request: MasterCSSSourceExtractionRequest): MasterCSSSourceExtraction {
    this.assertActive()
    return freezeToolingResult(this.parts.source.extract({
      files: request.files.map((file) => ({ ...file }))
    }))
  }

  extractClassCandidates(content: string) {
    this.assertActive()
    return Object.freeze([...this.parts.source.extractClassCandidates(content)])
  }

  validateClassNames(classNames: readonly string[]): MasterCSSClassValidationResult {
    this.assertActive()
    return freezeToolingResult(this.parts.validator.generate(classNames))
  }

  lintClassNames(classNames: readonly string[]): MasterCSSLintAnalysis {
    this.assertActive()
    return freezeToolingResult(this.parts.lint.analyze([...classNames]))
  }

  tokenizeClassList(
    classList: string,
    unescape?: string | false
  ): readonly MasterCSSLintToken[] {
    this.assertActive()
    return freezeToolingResult(this.parts.lint.tokenizeClassList(classList, unescape))
  }

  analyzeLintDocument(source: string, languageId: string): MasterCSSLintDocumentAnalysis {
    this.assertActive()
    return freezeToolingResult(this.parts.lint.analyzeDocument(source, languageId))
  }

  analyzeLintClassList(
    classList: string,
    classNames: readonly string[],
    options?: MasterCSSLintClassListOptions
  ): MasterCSSLintClassListAnalysis {
    this.assertActive()
    return freezeToolingResult(
      this.parts.lint.analyzeClassList(classList, [...classNames], options)
    )
  }

  canonicalClassNames(
    classNames: readonly string[],
    options?: CanonicalClassNameOptions
  ): readonly MasterCSSLintCanonicalClassSuggestion[] {
    this.assertActive()
    return freezeToolingResult(
      this.parts.lint.canonicalClassNames([...classNames], options)
    )
  }

  canonicalClassGroups(
    classNames: readonly string[],
    options?: CanonicalClassNameOptions
  ): readonly MasterCSSLintCanonicalClassGroupSuggestion[] {
    this.assertActive()
    return freezeToolingResult(
      this.parts.lint.canonicalClassGroups([...classNames], options)
    )
  }

  canonicalComposeDirective(
    classNames: readonly string[],
    options?: CanonicalClassNameOptions
  ) {
    this.assertActive()
    return freezeToolingResult(
      this.parts.lint.canonicalComposeDirective([...classNames], options)
    )
  }

  rawValueCandidates(classNames: readonly string[]): readonly MasterCSSLintRawValueCandidate[] {
    this.assertActive()
    return freezeToolingResult(this.parts.lint.rawValueCandidates([...classNames]))
  }

  analyzeDocument(request: MasterCSSDocumentAnalysisRequest): MasterCSSDocumentAnalysis {
    this.assertActive()
    return freezeToolingResult(this.parts.language.analyzeDocument(request))
  }

  formatDirectives(request: MasterCSSFormatDirectivesRequest): MasterCSSFormatDirectivesResult {
    this.assertActive()
    return freezeToolingResult(this.parts.language.formatDirectives(request))
  }

  classifyClassNames(classNames: readonly string[]): MasterCSSLanguageClassifications {
    this.assertActive()
    return freezeToolingResult(this.parts.language.classifyClassNames(classNames))
  }

  inspectClassName(className: string, mode?: string): MasterCSSLanguageInspection {
    this.assertActive()
    return freezeToolingResult(this.parts.language.inspectClassName(className, mode))
  }

  completionIndex(): MasterCSSLanguageCompletionIndex {
    this.assertActive()
    return freezeToolingResult(this.parts.language.completionIndex())
  }

  colorPresentation(colorToken: string): MasterCSSLanguageColorPresentation {
    this.assertActive()
    return freezeToolingResult(this.parts.language.colorPresentation(colorToken))
  }

  colorTokens(candidates: readonly MasterCSSLanguageColorCandidate[]): MasterCSSLanguageColorTokens {
    this.assertActive()
    return freezeToolingResult(this.parts.language.colorTokens(candidates))
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    const sessions = new Set<{ dispose(): void }>([
      this.parts.lexer,
      this.parts.source,
      this.parts.validator,
      this.parts.lint,
      this.parts.language
    ])
    for (const session of sessions) session.dispose()
  }

  [Symbol.dispose]() {
    this.dispose()
  }

  private assertActive() {
    if (this.disposed) {
      throw new TypeError('The Master CSS tooling session has been disposed.')
    }
  }

  static {
    bindToolingSession = (parts) => new MasterCSSToolingSession(parts)
  }
}

export async function createToolingSession(
  options: MasterCSSToolingSessionOptions
): Promise<MasterCSSToolingSession> {
  const binding = await createToolingBinding({ binding: options.binding })
  const created: { dispose(): void }[] = []
  try {
    const lexerBinding = await binding.createLexerSession()
    created.push(lexerBinding)
    const sourceBinding = await binding.createSourceSession()
    created.push(sourceBinding)
    const validatorBinding = await binding.createValidatorSession(options.manifest)
    created.push(validatorBinding)
    const languageBinding = await binding.createLanguageSession(options.manifest)
    created.push(languageBinding)
    const lintBinding = await binding.createLintSession(options.manifest)
    created.push(lintBinding)
    const lintValidatorBinding = await binding.createValidatorSession(options.manifest)
    created.push(lintValidatorBinding)
    const lintLanguageBinding = await binding.createLanguageSession(options.manifest)
    created.push(lintLanguageBinding)
    const session = bindToolingSession({
      lexer: bindLexerSession(binding.binding, lexerBinding),
      source: bindSourceExtractor(binding.binding, sourceBinding),
      validator: bindValidatorSession(binding.binding, validatorBinding),
      lint: bindLintSession(lintBinding, lintValidatorBinding, lintLanguageBinding),
      language: bindLanguageSession(binding.binding, languageBinding)
    })
    created.length = 0
    return session
  } catch (cause) {
    for (const session of new Set(created)) session.dispose()
    throw cause
  }
}

/** @internal */
export function bindToolingSessionInternal(parts: ToolingSessionParts) {
  return bindToolingSession(parts)
}
