import { readFile } from 'node:fs/promises'
import { loadNativeBinding } from '@master/css-native'
import { MASTER_CSS_LANGUAGE_BATCH_VERSION } from '@master/css-schema/rust-contract'
import type { SemanticTokenItem } from './semantic/types'

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
}

export class RustLanguageAnalyzerError extends Error {
  code: 'NATIVE_UNAVAILABLE' | 'LANGUAGE_BATCH_VERSION_MISMATCH'

  constructor(code: RustLanguageAnalyzerError['code'], message: string) {
    super(message)
    this.name = 'RustLanguageAnalyzerError'
    this.code = code
  }
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

function createNativeAnalyzer(): RustLanguageAnalyzer | undefined {
  const loaded = loadNativeBinding()
  if (!loaded) return
  return {
    analyze(source, contexts, semanticTokens) {
      return validateLanguageBatch(JSON.parse(loaded.binding.analyzeLanguageJson(
        source,
        JSON.stringify(contexts),
        JSON.stringify(semanticTokens)
      )) as RustLanguageBatchIR)
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
  return {
    analyze(source, contexts, semanticTokens) {
      return validateLanguageBatch(tooling.analyzeLanguage(source, contexts, semanticTokens) as RustLanguageBatchIR)
    }
  }
}
