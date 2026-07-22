import { loadNativeBinding } from '@master/css-native'
import { initToolingWasm } from '@master/css-wasm-tooling'
import { MASTER_CSS_SOURCE_BATCH_VERSION } from '@master/css-schema'
import type {
  MasterCSSSourceBatchIR,
  MasterCSSSourceBatchRequestIR,
  MasterCSSSourceExtractorKind
} from '@master/css-schema/rust-contract'

export type SourceBatchRequest = MasterCSSSourceBatchRequestIR
export type SourceBatchIR = MasterCSSSourceBatchIR
export type SourceExtractorKind = MasterCSSSourceExtractorKind

export interface SourceExtractor {
  readonly backend: 'native' | 'wasm'
  extract(request: SourceBatchRequest): SourceBatchIR
  extractClassCandidates(content: string): string[]
  extractOxcClasses(source: string, content: string): string[]
  extractHTMLClasses(source: string, content: string): string[]
  extractAstroClasses(source: string, content: string): string[]
  dispose(): void
}

export class SourceExtractorError extends Error {
  constructor(
    public readonly code: 'SOURCE_BATCH_VERSION_MISMATCH',
    message: string
  ) {
    super(message)
    this.name = 'SourceExtractorError'
  }
}

interface BackendSourceSession {
  extract(request: unknown): unknown
  dispose(): void
}

function parse(value: unknown): SourceBatchIR {
  const result = typeof value === 'string' ? JSON.parse(value) as SourceBatchIR : value as SourceBatchIR
  if (result.version !== MASTER_CSS_SOURCE_BATCH_VERSION) {
    throw new SourceExtractorError(
      'SOURCE_BATCH_VERSION_MISMATCH',
      `Expected Master CSS source batch version ${MASTER_CSS_SOURCE_BATCH_VERSION}, received ${String(result.version)}.`
    )
  }
  return result
}

function bindSourceExtractor(backend: SourceExtractor['backend'], session: BackendSourceSession): SourceExtractor {
  const extract = (request: SourceBatchRequest) => parse(session.extract(
    backend === 'native' ? JSON.stringify(request) : request
  ))
  const candidates = (source: string, content: string, kind: SourceExtractorKind) =>
    extract({ files: [{ source, content, kind }] }).files[0]?.candidates ?? []
  return {
    backend,
    extract,
    extractClassCandidates: (content) => candidates('', content, 'raw'),
    extractOxcClasses: (source, content) => candidates(source, content, 'oxc'),
    extractHTMLClasses: (source, content) => candidates(source, content, 'html'),
    extractAstroClasses: (source, content) => candidates(source, content, 'astro'),
    dispose: () => session.dispose()
  }
}

export function createNativeSourceExtractor(): SourceExtractor | undefined {
  const loaded = loadNativeBinding()
  if (!loaded) return
  return bindSourceExtractor('native', new loaded.binding.SourceSession())
}

export async function createSourceExtractor(): Promise<SourceExtractor> {
  const native = createNativeSourceExtractor()
  if (native) return native
  const module = await initToolingWasm()
  const raw = new module.ToolingSourceSession()
  return bindSourceExtractor('wasm', {
    extract: (request) => raw.extract(request),
    dispose() {
      raw.dispose()
      raw.free()
    }
  })
}
