import { createToolingBinding } from '@master/css-binding/tooling'
import type {
  MasterCSSSourceBatch,
  MasterCSSSourceBatchRequest,
  MasterCSSSourceExtractorKind
} from '@master/css-binding/tooling'
import { MASTER_CSS_SOURCE_BATCH_VERSION } from '@master/css-binding/tooling'

export type SourceBatchRequest = MasterCSSSourceBatchRequest
export type SourceExtractorKind = MasterCSSSourceExtractorKind

export interface SourceExtractor {
  readonly binding: 'native' | 'wasm'
  extract(request: SourceBatchRequest): MasterCSSSourceBatch
  extractClassCandidates(content: string): string[]
  extractOxcClasses(source: string, content: string): string[]
  extractHTMLClasses(source: string, content: string): string[]
  extractAstroClasses(source: string, content: string): string[]
  dispose(): void
}

export class SourceExtractorError extends Error {
  constructor(
    public readonly code: 'NATIVE_UNAVAILABLE' | 'SOURCE_BATCH_VERSION_MISMATCH',
    message: string
  ) {
    super(message)
    this.name = 'SourceExtractorError'
  }
}

interface BindingSourceSession {
  extract(request: unknown): unknown
  dispose(): void
}

function parse(value: unknown): MasterCSSSourceBatch {
  const result = value as MasterCSSSourceBatch
  if (result.version !== MASTER_CSS_SOURCE_BATCH_VERSION) {
    throw new SourceExtractorError(
      'SOURCE_BATCH_VERSION_MISMATCH',
      `Expected Master CSS source batch version ${MASTER_CSS_SOURCE_BATCH_VERSION}, received ${String(result.version)}.`
    )
  }
  return result
}

export function bindSourceExtractor(binding: SourceExtractor['binding'], session: BindingSourceSession): SourceExtractor {
  const extract = (request: SourceBatchRequest) => parse(session.extract(request))
  const candidates = (source: string, content: string, kind: SourceExtractorKind) =>
    extract({ files: [{ source, content, kind }] }).files[0]?.candidates ?? []
  return {
    binding,
    extract,
    extractClassCandidates: (content) => candidates('', content, 'raw'),
    extractOxcClasses: (source, content) => candidates(source, content, 'oxc'),
    extractHTMLClasses: (source, content) => candidates(source, content, 'html'),
    extractAstroClasses: (source, content) => candidates(source, content, 'astro'),
    dispose: () => session.dispose()
  }
}

export async function createSourceExtractor(
  options: { readonly binding?: 'auto' | 'native' | 'wasm' } = {}
): Promise<SourceExtractor> {
  const tooling = await createToolingBinding({ binding: options.binding })
  return bindSourceExtractor(
    tooling.binding,
    await tooling.createSourceSession()
  )
}
