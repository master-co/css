import type { MasterCSSLanguageInspection as BindingInspection } from '@master/css-binding/tooling'
import type { MasterCSSHydrationRule } from '@master/css-schema/hydration-manifest'
import type {
  MasterCSSManifestVariable,
  MasterCSSManifestVariableNumericValue
} from '@master/css-schema/manifest'
import type { SemanticTokenItem } from './semantic/types'

export type MasterCSSLanguageClassKind =
  | 'unknown'
  | 'component'
  | 'semantic'
  | 'pattern'
  | 'declaration'
  | 'token'

export interface MasterCSSLanguageClassListContext {
  readonly start: number
  readonly end: number
  readonly unescape?: readonly string[]
}

export interface MasterCSSLanguageClassPosition {
  readonly range: Readonly<{ start: number, end: number }>
  readonly contextRange: Readonly<{ start: number, end: number }>
  readonly raw: string
  readonly token: string
}

export interface MasterCSSDocumentAnalysisRequest {
  readonly source: string
  readonly languageId: string
  readonly hostRanges?: readonly MasterCSSLanguageClassListContext[]
  readonly settings?: Readonly<{
    classAttributes?: readonly string[]
    classFunctions?: readonly string[]
    classDeclarations?: readonly string[]
  }>
}

export interface MasterCSSDocumentAnalysis {
  readonly version: 3
  readonly classPositions: readonly MasterCSSLanguageClassPosition[]
  readonly semanticTokens: readonly SemanticTokenItem[]
  readonly semanticTokenData: readonly number[]
}

export interface MasterCSSFormatDirectivesRequest {
  readonly source: string
  readonly range?: Readonly<{ start: number, end: number }>
  readonly styleRanges?: readonly Readonly<{ start: number, end: number }>[]
}

export interface MasterCSSFormatDirectivesResult {
  readonly version: 3
  readonly edits: readonly Readonly<{
    range: Readonly<{ start: number, end: number }>
    text: string
  }>[]
}

export interface MasterCSSLanguageClass {
  readonly className: string
  readonly kind: MasterCSSLanguageClassKind
  readonly matcherTypes: readonly ('static' | 'pattern' | 'key' | 'token' | 'value')[]
  readonly keyToken?: string
  readonly valueToken?: string
  readonly stateToken?: string
  readonly important: boolean
}

export interface MasterCSSLanguageClassifications {
  readonly version: 3
  readonly variableNames: readonly string[]
  readonly classes: readonly MasterCSSLanguageClass[]
}

export interface MasterCSSLanguageVariable {
  readonly namespace?: string
  readonly name: string
  readonly key: string
  readonly type: string
  readonly value?: string | number
  readonly numeric?: MasterCSSManifestVariableNumericValue
  readonly modes?: MasterCSSManifestVariable['modes']
  readonly dependencies?: readonly string[]
  readonly inline?: boolean
  readonly static?: boolean
}

export interface MasterCSSLanguageClassVariable {
  readonly key: string
  readonly variable: MasterCSSLanguageVariable
}

export interface MasterCSSLanguageInspection {
  readonly version: 3
  readonly className: string
  readonly matchStatus: BindingInspection['matchStatus']
  readonly declarations: readonly import('../value-validation').DeclarationValidation[]
  readonly checks: readonly (typeof import('../value-validation').CSS_VALUE_CHECK)[]
  readonly cssValueStatus: BindingInspection['cssValueStatus']
  readonly browserSupport: BindingInspection['browserSupport']
  readonly kind: MasterCSSLanguageClassKind
  readonly base: string
  readonly suffix: string
  readonly key?: string
  readonly value?: string
  readonly keyToken?: string
  readonly valueToken?: string
  readonly stateToken?: string
  readonly important: boolean
  readonly matcherTypes: readonly ('static' | 'pattern' | 'key' | 'token' | 'value')[]
  readonly variables: readonly MasterCSSLanguageClassVariable[]
  readonly rules: readonly MasterCSSHydrationRule[]
  readonly diagnostics?: BindingInspection['diagnostics']
  readonly text: string
}

export type MasterCSSLanguageCompletionKind = 'property' | 'value' | 'function'

export interface MasterCSSLanguageCompletionEntry {
  readonly label: string
  readonly kind: MasterCSSLanguageCompletionKind
  readonly detail?: string
  readonly documentationText?: string
  readonly sortText?: string
  readonly triggerSuggest: boolean
}

export interface MasterCSSLanguageCompletionIndex {
  readonly version: 3
  readonly classEntries: readonly MasterCSSLanguageCompletionEntry[]
}

export interface MasterCSSLanguageColorPresentation {
  readonly version: 3
  readonly editable: boolean
  readonly replacementPrefix?: string
  readonly colorToken: string
  readonly sourceFormat?: MasterCSSLanguageColorFormat
}

export interface MasterCSSLanguageColorFormat {
  readonly syntax: string
  readonly space?: string
}

export interface MasterCSSLanguageColorCandidate {
  readonly className: string
  readonly start: number
}

export interface MasterCSSLanguageColorToken {
  readonly range: Readonly<{ start: number, end: number }>
  readonly expression: MasterCSSLanguageColorExpression
}

export type MasterCSSLanguageColorExpression =
  | Readonly<{
      kind: 'literal'
      value: string
      alpha?: number
    }>
  | Readonly<{
      kind: 'mix'
      space: string
      hue?: string
      left: MasterCSSLanguageColorExpression
      right: MasterCSSLanguageColorExpression
      progress: number
      alphaMultiplier: number
    }>

export interface MasterCSSLanguageColorTokens {
  readonly version: 3
  readonly tokens: readonly MasterCSSLanguageColorToken[]
}
