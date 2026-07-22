import { readFile } from 'node:fs/promises'
import { loadNativeBinding } from '@master/css-native'
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

export async function createRustLanguageAnalyzer(): Promise<RustLanguageAnalyzer> {
  const loaded = loadNativeBinding()
  if (loaded) {
    return {
      analyze(source, contexts, semanticTokens) {
        return JSON.parse(loaded.binding.analyzeLanguageJson(
          source,
          JSON.stringify(contexts),
          JSON.stringify(semanticTokens)
        )) as RustLanguageBatchIR
      }
    }
  }

  const [{ initToolingWasm }, wasmBytes] = await Promise.all([
    import('@master/css-wasm-tooling'),
    readFile(new URL(import.meta.resolve('@master/css-wasm-tooling/wasm')))
  ])
  const input = new Uint8Array(wasmBytes)
  const tooling = await initToolingWasm({ input })
  return {
    analyze(source, contexts, semanticTokens) {
      return tooling.analyzeLanguage(source, contexts, semanticTokens) as RustLanguageBatchIR
    }
  }
}
