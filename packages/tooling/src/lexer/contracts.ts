export interface MasterCSSSourceRange {
  readonly start: number
  readonly end: number
}

export interface MasterCSSClassListInput {
  readonly source: string
  readonly unescape?: readonly string[]
}

export interface MasterCSSClassListAnalysisRequest {
  readonly classLists?: readonly MasterCSSClassListInput[]
  readonly cssSources?: readonly string[]
  readonly escapeIdentifiers?: readonly string[]
}

export interface MasterCSSClassListItem {
  readonly range: MasterCSSSourceRange
  readonly raw: string
  readonly token: string
}

export interface MasterCSSCSSDirectiveAnalysis {
  readonly name: string
  readonly range: MasterCSSSourceRange
  readonly preludeRange: MasterCSSSourceRange
  readonly hasBlock: boolean
  readonly quotedStrings: number
}

export interface MasterCSSCSSImportAnalysis {
  readonly range: MasterCSSSourceRange
  readonly statement: string
  readonly source?: string
}

export interface MasterCSSCSSAnalysis {
  readonly directives: readonly MasterCSSCSSDirectiveAnalysis[]
  readonly imports: readonly MasterCSSCSSImportAnalysis[]
}

export interface MasterCSSClassListAnalysis {
  readonly version: 1
  readonly classLists: readonly (readonly MasterCSSClassListItem[])[]
  readonly cssSources: readonly MasterCSSCSSAnalysis[]
  readonly escapedIdentifiers: readonly string[]
}
