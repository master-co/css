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
  readonly version: 1
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
  readonly version: 1
  readonly edits: readonly Readonly<{
    range: Readonly<{ start: number, end: number }>
    text: string
  }>[]
}

export interface MasterCSSLanguageClass {
  readonly className: string
  readonly kind: MasterCSSLanguageClassKind
  readonly matcherTypes: readonly ('static' | 'pattern' | 'key' | 'variable' | 'value')[]
  readonly keyToken?: string
  readonly valueToken?: string
  readonly stateToken?: string
  readonly important: boolean
}

export interface MasterCSSLanguageClassifications {
  readonly version: 1
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
  readonly version: 1
  readonly className: string
  readonly valid: boolean
  readonly kind: MasterCSSLanguageClassKind
  readonly base: string
  readonly suffix: string
  readonly key?: string
  readonly value?: string
  readonly keyToken?: string
  readonly valueToken?: string
  readonly stateToken?: string
  readonly important: boolean
  readonly matcherTypes: readonly ('static' | 'pattern' | 'key' | 'variable' | 'value')[]
  readonly variables: readonly MasterCSSLanguageClassVariable[]
  readonly rules: readonly MasterCSSHydrationRule[]
  readonly text: string
}

export type MasterCSSLanguageCompletionKind = 'property' | 'value'

export interface MasterCSSLanguageCompletionEntry {
  readonly label: string
  readonly kind: MasterCSSLanguageCompletionKind
  readonly detail?: string
  readonly documentationText?: string
  readonly sortText?: string
  readonly triggerSuggest: boolean
}

export interface MasterCSSLanguageCompletionIndex {
  readonly version: 1
  readonly classEntries: readonly MasterCSSLanguageCompletionEntry[]
}

export interface MasterCSSLanguageColorPresentation {
  readonly version: 1
  readonly colorToken: string
  readonly space?: string
}

export interface MasterCSSLanguageColorCandidate {
  readonly className: string
  readonly start: number
}

export interface MasterCSSLanguageColorToken {
  readonly range: Readonly<{ start: number, end: number }>
  readonly value: string
  readonly alpha?: number
}

export interface MasterCSSLanguageColorTokens {
  readonly version: 1
  readonly tokens: readonly MasterCSSLanguageColorToken[]
}
