import { loadNativeBinding } from '@master/css-native'
import { MASTER_CSS_LANGUAGE_BATCH_VERSION } from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import type {
  MasterCSSLanguageClassificationsIR,
  MasterCSSLanguageColorCandidateInputIR,
  MasterCSSLanguageColorPresentationIR,
  MasterCSSLanguageColorTokensIR,
  MasterCSSLanguageCompletionIndexIR,
  MasterCSSLanguageInspectionIR,
  MasterCSSNativeDeclarationCandidateIR
} from '@master/css-schema/rust-contract'
import type { SemanticTokenItem } from './semantic/types'
import { matchesLanguageServiceNativeDeclaration } from './master-css'

export interface LanguageClassListContextIR {
  start: number
  end: number
  unescape?: string[]
}

export interface LanguageClassPositionIR {
  range: { start: number, end: number }
  contextRange: { start: number, end: number }
  raw: string
  token: string
}

export interface AnalyzeDocumentRequest {
  source: string
  languageId: string
  hostRanges?: LanguageClassListContextIR[]
  settings?: {
    classAttributes?: string[]
    classFunctions?: string[]
    classDeclarations?: string[]
  }
}

export interface LanguageDocumentIR {
  version: typeof MASTER_CSS_LANGUAGE_BATCH_VERSION
  classPositions: LanguageClassPositionIR[]
  semanticTokens: SemanticTokenItem[]
  semanticTokenData: number[]
}

export interface FormatDirectivesRequest {
  source: string
  range?: { start: number, end: number }
  styleRanges?: { start: number, end: number }[]
}

export interface LanguageFormatEditsIR {
  version: typeof MASTER_CSS_LANGUAGE_BATCH_VERSION
  edits: {
    range: { start: number, end: number }
    text: string
  }[]
}

interface BackendLanguageSession {
  analyzeDocument(request: unknown): unknown
  formatDirectives(request: unknown): unknown
  nativeDeclarationCandidates(classNames: string[]): unknown
  classifyClassNames(classNames: string[], nativeSupport?: boolean[]): unknown
  inspectClassName(className: string, nativeSupport?: boolean[], mode?: string): unknown
  completionIndex(): unknown
  colorPresentation(colorToken: string): unknown
  colorTokens(candidates: unknown): unknown
  dispose(): void
}

export interface LanguageSession {
  readonly backend: 'native' | 'wasm'
  analyzeDocument(request: AnalyzeDocumentRequest): LanguageDocumentIR
  formatDirectives(request: FormatDirectivesRequest): LanguageFormatEditsIR
  classifyClassNames(classNames: readonly string[]): MasterCSSLanguageClassificationsIR
  inspectClassName(className: string, mode?: string): MasterCSSLanguageInspectionIR
  completionIndex(): MasterCSSLanguageCompletionIndexIR
  colorPresentation(colorToken: string): MasterCSSLanguageColorPresentationIR
  colorTokens(candidates: MasterCSSLanguageColorCandidateInputIR[]): MasterCSSLanguageColorTokensIR
  dispose(): void
}

export class LanguageSessionError extends Error {
  constructor(
    public readonly code: 'NATIVE_UNAVAILABLE' | 'LANGUAGE_BATCH_VERSION_MISMATCH',
    message: string
  ) {
    super(message)
    this.name = 'LanguageSessionError'
  }
}

function parse<T>(value: unknown): T {
  return typeof value === 'string' ? JSON.parse(value) as T : value as T
}

function validate<T extends { version: number }>(value: T): T {
  if (value.version !== MASTER_CSS_LANGUAGE_BATCH_VERSION) {
    throw new LanguageSessionError(
      'LANGUAGE_BATCH_VERSION_MISMATCH',
      `Expected Master CSS language batch version ${MASTER_CSS_LANGUAGE_BATCH_VERSION}, received ${String(value.version)}.`
    )
  }
  return value
}

export function bindLanguageSession(
  backend: LanguageSession['backend'],
  session: BackendLanguageSession
): LanguageSession {
  const nativeSupport = (classNames: string[]) => parse<MasterCSSNativeDeclarationCandidateIR[]>(
    session.nativeDeclarationCandidates(classNames)
  ).map(matchesLanguageServiceNativeDeclaration)
  return {
    backend,
    analyzeDocument(request) {
      return validate(parse<LanguageDocumentIR>(session.analyzeDocument(
        backend === 'native' ? JSON.stringify(request) : request
      )))
    },
    formatDirectives(request) {
      return validate(parse<LanguageFormatEditsIR>(session.formatDirectives(
        backend === 'native' ? JSON.stringify(request) : request
      )))
    },
    classifyClassNames(classNames) {
      const values = [...classNames]
      return validate(parse<MasterCSSLanguageClassificationsIR>(
        session.classifyClassNames(values, nativeSupport(values))
      ))
    },
    inspectClassName(className, mode) {
      return validate(parse<MasterCSSLanguageInspectionIR>(
        session.inspectClassName(className, nativeSupport([className]), mode)
      ))
    },
    completionIndex: () => validate(parse<MasterCSSLanguageCompletionIndexIR>(session.completionIndex())),
    colorPresentation: (token) => validate(parse<MasterCSSLanguageColorPresentationIR>(session.colorPresentation(token))),
    colorTokens: (candidates) => validate(parse<MasterCSSLanguageColorTokensIR>(session.colorTokens(
      backend === 'native' ? JSON.stringify(candidates) : candidates
    ))),
    dispose: () => session.dispose()
  }
}

export function createNativeLanguageSession(
  manifestJSON: string,
  options: { required?: boolean } = {}
): LanguageSession | undefined {
  const loaded = loadNativeBinding({ required: options.required })
  if (!loaded) return
  return bindLanguageSession('native', new loaded.binding.LanguageSession(manifestJSON))
}

export async function createLanguageSession(manifest: MasterCSSManifest): Promise<LanguageSession> {
  const manifestJSON = stringifyMasterCSSManifestJSON(manifest)
  const native = createNativeLanguageSession(manifestJSON)
  if (native) return native
  const { initToolingWasm } = await import('@master/css-wasm-tooling')
  const tooling = await initToolingWasm()
  const session = new tooling.ToolingLanguageSession(manifestJSON)
  return bindLanguageSession('wasm', session)
}

export type {
  MasterCSSLanguageClassificationsIR,
  MasterCSSLanguageClassIR,
  MasterCSSLanguageColorCandidateInputIR,
  MasterCSSLanguageColorPresentationIR,
  MasterCSSLanguageColorTokensIR,
  MasterCSSLanguageCompletionIndexIR,
  MasterCSSLanguageInspectionIR
} from '@master/css-schema/rust-contract'
