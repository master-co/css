import type {
  CSSDirectiveExtractionPolicy,
  CSSDirectiveReference,
  CSSDirectiveResult
} from '@master/css-schema/css-directives'

export interface CompileCSSOptions {
  classes?: string[]
  from?: string
  preserveNativeCSS?: boolean
  onWarning?: (warning: string) => void
}

export interface CompileCSSFileOptions extends CompileCSSOptions {
  root?: string
}

export type CompileCSSResult = CSSDirectiveResult

export interface ResolvedCSSImportGraph {
  source: string
  dependencies: string[]
  references?: CSSDirectiveReference[]
}

export type CSSReferenceStatement = CSSDirectiveReference & {
  start: number
  end: number
  statement: string
}

export function emptyExtractionPolicy(): CSSDirectiveExtractionPolicy {
  return {
    include: [],
    exclude: [],
    safelist: [],
    blocklist: [],
    preserveNative: false
  }
}
