import { readFile } from 'node:fs/promises'
import { loadNativeBinding } from '@master/css-native'
import { MASTER_CSS_LANGUAGE_BATCH_VERSION } from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import type {
  MasterCSSLanguageClassificationsIR,
  MasterCSSLanguageClassIR,
  MasterCSSLanguageColorCandidateInputIR,
  MasterCSSLanguageColorPresentationIR,
  MasterCSSLanguageColorTokensIR,
  MasterCSSLanguageCompletionIndexIR,
  MasterCSSLanguageInspectionIR,
  MasterCSSNativeDeclarationCandidateIR
} from '@master/css-schema/rust-contract'
import type { SemanticTokenItem } from './semantic/types'
import { matchesLanguageServiceNativeDeclaration } from './master-css'

export interface RustClassListContextIR {
  start: number
  end: number
  unescape?: string[]
}

export interface RustLanguageBatchIR {
  version: 1
  classPositions: {
    range: { start: number, end: number }
    contextRange: { start: number, end: number }
    raw: string
    token: string
  }[]
  semanticTokenData: number[]
}

export interface RustLanguageAnalyzer {
  analyze(
    source: string,
    contexts: RustClassListContextIR[],
    semanticTokens: SemanticTokenItem[]
  ): RustLanguageBatchIR
  classifyClassNames?(classNames: string[]): MasterCSSLanguageClassificationsIR
  inspectClassName?(className: string, mode?: string): MasterCSSLanguageInspectionIR
  completionIndex?(): MasterCSSLanguageCompletionIndexIR
  colorPresentation?(colorToken: string): MasterCSSLanguageColorPresentationIR
  colorTokens?(candidates: MasterCSSLanguageColorCandidateInputIR[]): MasterCSSLanguageColorTokensIR
  createSession?(manifest: MasterCSSManifest): RustLanguageAnalyzer
  dispose?(): void
}

export class RustLanguageAnalyzerError extends Error {
  code: 'NATIVE_UNAVAILABLE' | 'LANGUAGE_BATCH_VERSION_MISMATCH'

  constructor(code: RustLanguageAnalyzerError['code'], message: string) {
    super(message)
    this.name = 'RustLanguageAnalyzerError'
    this.code = code
  }
}

export type {
  MasterCSSLanguageClassificationsIR,
  MasterCSSLanguageClassIR,
  MasterCSSLanguageColorCandidateInputIR,
  MasterCSSLanguageColorPresentationIR,
  MasterCSSLanguageColorTokensIR,
  MasterCSSLanguageCompletionIndexIR,
  MasterCSSLanguageInspectionIR
}

function validateLanguageBatch(batch: RustLanguageBatchIR): RustLanguageBatchIR {
  if (batch.version !== MASTER_CSS_LANGUAGE_BATCH_VERSION) {
    throw new RustLanguageAnalyzerError(
      'LANGUAGE_BATCH_VERSION_MISMATCH',
      `Expected Master CSS language batch version ${MASTER_CSS_LANGUAGE_BATCH_VERSION}, received ${String(batch.version)}.`
    )
  }
  return batch
}

function validateClassifications(
  batch: MasterCSSLanguageClassificationsIR
): MasterCSSLanguageClassificationsIR {
  if (batch.version !== MASTER_CSS_LANGUAGE_BATCH_VERSION) {
    throw new RustLanguageAnalyzerError(
      'LANGUAGE_BATCH_VERSION_MISMATCH',
      `Expected Master CSS language batch version ${MASTER_CSS_LANGUAGE_BATCH_VERSION}, received ${String(batch.version)}.`
    )
  }
  return batch
}

function validateInspection(
  inspection: MasterCSSLanguageInspectionIR
): MasterCSSLanguageInspectionIR {
  if (inspection.version !== MASTER_CSS_LANGUAGE_BATCH_VERSION) {
    throw new RustLanguageAnalyzerError(
      'LANGUAGE_BATCH_VERSION_MISMATCH',
      `Expected Master CSS language batch version ${MASTER_CSS_LANGUAGE_BATCH_VERSION}, received ${String(inspection.version)}.`
    )
  }
  return inspection
}

function validateCompletionIndex(
  index: MasterCSSLanguageCompletionIndexIR
): MasterCSSLanguageCompletionIndexIR {
  if (index.version !== MASTER_CSS_LANGUAGE_BATCH_VERSION) {
    throw new RustLanguageAnalyzerError(
      'LANGUAGE_BATCH_VERSION_MISMATCH',
      `Expected Master CSS language batch version ${MASTER_CSS_LANGUAGE_BATCH_VERSION}, received ${String(index.version)}.`
    )
  }
  return index
}

function validateColorPresentation(
  presentation: MasterCSSLanguageColorPresentationIR
): MasterCSSLanguageColorPresentationIR {
  if (presentation.version !== MASTER_CSS_LANGUAGE_BATCH_VERSION) {
    throw new RustLanguageAnalyzerError(
      'LANGUAGE_BATCH_VERSION_MISMATCH',
      `Expected Master CSS language batch version ${MASTER_CSS_LANGUAGE_BATCH_VERSION}, received ${String(presentation.version)}.`
    )
  }
  return presentation
}

function validateColorTokens(tokens: MasterCSSLanguageColorTokensIR): MasterCSSLanguageColorTokensIR {
  if (tokens.version !== MASTER_CSS_LANGUAGE_BATCH_VERSION) {
    throw new RustLanguageAnalyzerError(
      'LANGUAGE_BATCH_VERSION_MISMATCH',
      `Expected Master CSS language batch version ${MASTER_CSS_LANGUAGE_BATCH_VERSION}, received ${String(tokens.version)}.`
    )
  }
  return tokens
}

function createNativeAnalyzer(): RustLanguageAnalyzer | undefined {
  const loaded = loadNativeBinding()
  if (!loaded) return
  const analyze: RustLanguageAnalyzer['analyze'] = (source, contexts, semanticTokens) => {
    return validateLanguageBatch(JSON.parse(loaded.binding.analyzeLanguageJson(
      source,
      JSON.stringify(contexts),
      JSON.stringify(semanticTokens)
    )) as RustLanguageBatchIR)
  }
  return {
    analyze,
    createSession(manifest) {
      const session = new loaded.binding.LanguageSession(stringifyMasterCSSManifestJSON(manifest))
      return {
        analyze,
        classifyClassNames(classNames) {
          const candidates = JSON.parse(
            session.nativeDeclarationCandidates(classNames)
          ) as MasterCSSNativeDeclarationCandidateIR[]
          const nativeSupport = candidates.map(matchesLanguageServiceNativeDeclaration)
          return validateClassifications(JSON.parse(
            session.classifyClassNames(
              classNames,
              nativeSupport.length ? nativeSupport : undefined
            )
          ) as MasterCSSLanguageClassificationsIR)
        },
        inspectClassName(className, mode) {
          const candidates = JSON.parse(
            session.nativeDeclarationCandidates([className])
          ) as MasterCSSNativeDeclarationCandidateIR[]
          const nativeSupport = candidates.map(matchesLanguageServiceNativeDeclaration)
          return validateInspection(JSON.parse(session.inspectClassName(
            className,
            nativeSupport.length ? nativeSupport : undefined,
            mode
          )) as MasterCSSLanguageInspectionIR)
        },
        completionIndex() {
          return validateCompletionIndex(
            JSON.parse(session.completionIndex()) as MasterCSSLanguageCompletionIndexIR
          )
        },
        colorPresentation(colorToken) {
          return validateColorPresentation(
            JSON.parse(session.colorPresentation(colorToken)) as MasterCSSLanguageColorPresentationIR
          )
        },
        colorTokens(candidates) {
          return validateColorTokens(
            JSON.parse(session.colorTokens(JSON.stringify(candidates))) as MasterCSSLanguageColorTokensIR
          )
        },
        dispose() {
          session.dispose()
        }
      }
    }
  }
}

export function createRustLanguageAnalyzerSync(): RustLanguageAnalyzer {
  const analyzer = createNativeAnalyzer()
  if (analyzer) return analyzer
  throw new RustLanguageAnalyzerError(
    'NATIVE_UNAVAILABLE',
    'The native Master CSS language analyzer is unavailable. Use createRustLanguageAnalyzer() to allow the tooling Wasm backend.'
  )
}

export async function createRustLanguageAnalyzer(): Promise<RustLanguageAnalyzer> {
  const nativeAnalyzer = createNativeAnalyzer()
  if (nativeAnalyzer) return nativeAnalyzer

  const [{ initToolingWasm }, wasmBytes] = await Promise.all([
    import('@master/css-wasm-tooling'),
    readFile(new URL(import.meta.resolve('@master/css-wasm-tooling/wasm')))
  ])
  const input = new Uint8Array(wasmBytes)
  const tooling = await initToolingWasm({ input })
  const analyze: RustLanguageAnalyzer['analyze'] = (source, contexts, semanticTokens) => {
    return validateLanguageBatch(tooling.analyzeLanguage(source, contexts, semanticTokens) as RustLanguageBatchIR)
  }
  return {
    analyze,
    createSession(manifest) {
      const session = new tooling.ToolingLanguageSession(stringifyMasterCSSManifestJSON(manifest))
      return {
        analyze,
        classifyClassNames(classNames) {
          const candidates = session.nativeDeclarationCandidates(
            classNames
          ) as MasterCSSNativeDeclarationCandidateIR[]
          const nativeSupport = candidates.map(matchesLanguageServiceNativeDeclaration)
          return validateClassifications(
            session.classifyClassNames(
              classNames,
              nativeSupport
            ) as MasterCSSLanguageClassificationsIR
          )
        },
        inspectClassName(className, mode) {
          const candidates = session.nativeDeclarationCandidates(
            [className]
          ) as MasterCSSNativeDeclarationCandidateIR[]
          const nativeSupport = candidates.map(matchesLanguageServiceNativeDeclaration)
          return validateInspection(session.inspectClassName(
            className,
            nativeSupport,
            mode
          ) as MasterCSSLanguageInspectionIR)
        },
        completionIndex() {
          return validateCompletionIndex(
            session.completionIndex() as MasterCSSLanguageCompletionIndexIR
          )
        },
        colorPresentation(colorToken) {
          return validateColorPresentation(
            session.colorPresentation(colorToken) as MasterCSSLanguageColorPresentationIR
          )
        },
        colorTokens(candidates) {
          return validateColorTokens(
            session.colorTokens(candidates) as MasterCSSLanguageColorTokensIR
          )
        },
        dispose() {
          session.dispose()
          session.free()
        }
      }
    }
  }
}
