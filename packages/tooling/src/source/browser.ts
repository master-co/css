import {
  initToolingWasm,
  type InitToolingWasmOptions
} from '@master/css-wasm-tooling'
import { MASTER_CSS_SOURCE_BATCH_VERSION } from '@master/css-backend/tooling'
import type { SourceBatchIR, SourceBatchRequest, SourceExtractor } from './session'

export type BrowserSourceExtractor = SourceExtractor & { readonly backend: 'wasm' }

export async function createSourceExtractor(
  options: InitToolingWasmOptions = {}
): Promise<BrowserSourceExtractor> {
  const module = await initToolingWasm(options)
  const raw = new module.ToolingSourceSession()
  const extract = (request: SourceBatchRequest) => {
    const result = raw.extract(request) as SourceBatchIR
    if (result.version !== MASTER_CSS_SOURCE_BATCH_VERSION) {
      throw new Error(`Expected Master CSS source batch version ${MASTER_CSS_SOURCE_BATCH_VERSION}.`)
    }
    return result
  }
  const candidates = (source: string, content: string, kind: 'raw' | 'oxc' | 'html' | 'astro') =>
    extract({ files: [{ source, content, kind }] }).files[0]?.candidates ?? []
  return {
    backend: 'wasm',
    extract,
    extractClassCandidates: (content) => candidates('', content, 'raw'),
    extractOxcClasses: (source, content) => candidates(source, content, 'oxc'),
    extractHTMLClasses: (source, content) => candidates(source, content, 'html'),
    extractAstroClasses: (source, content) => candidates(source, content, 'astro'),
    dispose() {
      raw.dispose()
      raw.free()
    }
  }
}

export type { InitToolingWasmOptions }
