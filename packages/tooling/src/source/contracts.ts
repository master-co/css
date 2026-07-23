export type MasterCSSSourceKind = 'auto' | 'raw' | 'oxc' | 'html' | 'astro'

export interface MasterCSSSourceExtractionInput {
  readonly source: string
  readonly content: string
  readonly kind?: MasterCSSSourceKind
}

export interface MasterCSSSourceExtractionRequest {
  readonly files: readonly MasterCSSSourceExtractionInput[]
}

export interface MasterCSSExtractedSource {
  readonly source: string
  readonly candidates: readonly string[]
}

export interface MasterCSSSourceExtraction {
  readonly version: 1
  readonly files: readonly MasterCSSExtractedSource[]
}
