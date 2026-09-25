import type {
  CSSDirectiveExtractionPolicy,
  CSSDirectiveReference,
  CSSDirectiveResult
} from '@master/css-schema/css-directives'
import type { MasterCSSDiagnostic } from '@master/css-schema'

export interface CompileCSSOptions {
  readonly classes?: readonly string[]
  readonly from?: string
  readonly preserveNativeCSS?: boolean
  /** Opt in to pruning native rules in project-owned files. */
  readonly pruneNativeCSS?: boolean
  /** Keep untouched native source for host transforms; incompatible with class pruning. */
  readonly preserveNativeSource?: boolean
  /** Report CSS value errors by default; error rejects the complete output. */
  readonly validation?: 'report' | 'error'
  readonly onDiagnostic?: (diagnostic: MasterCSSDiagnostic) => void
}

export interface CompileCSSFileOptions extends CompileCSSOptions {
  root?: string
}

export type CompileCSSResult = CSSDirectiveResult

export interface ResolvedCSSImportGraph {
  sourceMappings?: import('@master/css-schema/css-directives').CSSOutputMapping[]
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
    preserveNative: false,
    pruneNative: false
  }
}
