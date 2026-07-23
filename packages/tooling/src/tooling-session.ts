import type { MasterCSSBackend } from '@master/css-backend'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  createLexerSession as createWasmLexerSession
} from './lexer/browser'
import {
  createNativeLexerSession,
  type LexerSession
} from './lexer/session'
import type {
  MasterCSSClassListAnalysis,
  MasterCSSClassListAnalysisRequest
} from './lexer/contracts'
import {
  createLanguageSession,
  type LanguageSession
} from './language/backend-session'
import {
  createLintSession,
  type LintSession
} from './lint/backend-session'
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
  createSourceExtractor,
  type SourceExtractor
} from './source/session'
import type {
  MasterCSSSourceExtraction,
  MasterCSSSourceExtractionRequest
} from './source/contracts'
import {
  createValidator,
  type ValidatorSession
} from './validator/backend-session'
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
  readonly backend?: MasterCSSBackend
}

export class MasterCSSToolingSession implements Disposable {
  private disposed = false

  private constructor(private readonly parts: ToolingSessionParts) { }

  get backend(): 'native' | 'wasm' {
    this.assertActive()
    return this.parts.language.backend
  }

  analyzeClassList(request: MasterCSSClassListAnalysisRequest): MasterCSSClassListAnalysis {
    this.assertActive()
    return this.parts.lexer.analyze({
      classLists: request.classLists?.map((input) => ({
        source: input.source,
        ...(input.unescape ? { unescape: [...input.unescape] } : {})
      })),
      cssSources: request.cssSources ? [...request.cssSources] : undefined,
      escapeIdentifiers: request.escapeIdentifiers ? [...request.escapeIdentifiers] : undefined
    })
  }

  extractSource(request: MasterCSSSourceExtractionRequest): MasterCSSSourceExtraction {
    this.assertActive()
    return this.parts.source.extract({
      files: request.files.map((file) => ({ ...file }))
    })
  }

  extractClassCandidates(content: string) {
    this.assertActive()
    return Object.freeze([...this.parts.source.extractClassCandidates(content)])
  }

  validateClassNames(classNames: readonly string[]): MasterCSSClassValidationResult {
    this.assertActive()
    return this.parts.validator.generate(classNames)
  }

  lintClassNames(classNames: readonly string[]): MasterCSSLintAnalysis {
    this.assertActive()
    return this.parts.lint.analyze([...classNames])
  }

  tokenizeClassList(
    classList: string,
    unescape?: string | false
  ): readonly MasterCSSLintToken[] {
    this.assertActive()
    return this.parts.lint.tokenizeClassList(classList, unescape)
  }

  analyzeLintDocument(source: string, languageId: string): MasterCSSLintDocumentAnalysis {
    this.assertActive()
    return this.parts.lint.analyzeDocument(source, languageId)
  }

  analyzeLintClassList(
    classList: string,
    classNames: readonly string[],
    options?: MasterCSSLintClassListOptions
  ): MasterCSSLintClassListAnalysis {
    this.assertActive()
    return this.parts.lint.analyzeClassList(classList, [...classNames], options)
  }

  canonicalClassNames(
    classNames: readonly string[],
    options?: CanonicalClassNameOptions
  ): readonly MasterCSSLintCanonicalClassSuggestion[] {
    this.assertActive()
    return this.parts.lint.canonicalClassNames([...classNames], options)
  }

  canonicalClassGroups(
    classNames: readonly string[],
    options?: CanonicalClassNameOptions
  ): readonly MasterCSSLintCanonicalClassGroupSuggestion[] {
    this.assertActive()
    return this.parts.lint.canonicalClassGroups([...classNames], options)
  }

  canonicalComposeDirective(
    classNames: readonly string[],
    options?: CanonicalClassNameOptions
  ) {
    this.assertActive()
    return this.parts.lint.canonicalComposeDirective([...classNames], options)
  }

  rawValueCandidates(classNames: readonly string[]): readonly MasterCSSLintRawValueCandidate[] {
    this.assertActive()
    return this.parts.lint.rawValueCandidates([...classNames])
  }

  analyzeDocument(request: MasterCSSDocumentAnalysisRequest): MasterCSSDocumentAnalysis {
    this.assertActive()
    return this.parts.language.analyzeDocument(request)
  }

  formatDirectives(request: MasterCSSFormatDirectivesRequest): MasterCSSFormatDirectivesResult {
    this.assertActive()
    return this.parts.language.formatDirectives(request)
  }

  classifyClassNames(classNames: readonly string[]): MasterCSSLanguageClassifications {
    this.assertActive()
    return this.parts.language.classifyClassNames(classNames)
  }

  inspectClassName(className: string, mode?: string): MasterCSSLanguageInspection {
    this.assertActive()
    return this.parts.language.inspectClassName(className, mode)
  }

  completionIndex(): MasterCSSLanguageCompletionIndex {
    this.assertActive()
    return this.parts.language.completionIndex()
  }

  colorPresentation(colorToken: string): MasterCSSLanguageColorPresentation {
    this.assertActive()
    return this.parts.language.colorPresentation(colorToken)
  }

  colorTokens(candidates: readonly MasterCSSLanguageColorCandidate[]): MasterCSSLanguageColorTokens {
    this.assertActive()
    return this.parts.language.colorTokens(candidates)
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

async function createLexerSession(backend: MasterCSSBackend | undefined) {
  if (backend !== 'wasm') {
    const native = createNativeLexerSession({ required: backend === 'native' })
    if (native) return native
  }
  return createWasmLexerSession()
}

export async function createToolingSession(
  options: MasterCSSToolingSessionOptions
): Promise<MasterCSSToolingSession> {
  const backend = options.backend ?? 'auto'
  const [lexer, source, validator, lint, language] = await Promise.all([
    createLexerSession(backend),
    createSourceExtractor({ backend }),
    createValidator(options.manifest, { backend }),
    createLintSession(options.manifest, { backend }),
    createLanguageSession(options.manifest, { backend })
  ])
  return bindToolingSession({
    lexer,
    source,
    validator,
    lint,
    language
  })
}

/** @internal */
export function bindToolingSessionInternal(parts: ToolingSessionParts) {
  return bindToolingSession(parts)
}
