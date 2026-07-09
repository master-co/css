import type {
  MasterCSSManifestDefaultMode,
  MasterCSSManifestUtilityKind,
  MasterCSSManifestModeTrigger,
  MasterCSSManifestUtilityLayerName,
  MasterCSSManifestVariant
} from './manifest.js'

export type CSSDirectiveVariableValue = number | string | false | (number | string)[]

export type CSSDirectiveDeclarations = Record<string, string>

export type CSSDirectiveLayerName = MasterCSSManifestUtilityLayerName

export type CSSDirectiveModeTrigger = MasterCSSManifestModeTrigger

export type CSSDirectiveDefaultMode = MasterCSSManifestDefaultMode

export type CSSDirectiveVariantDefinitions = Pick<MasterCSSManifestVariant, 'token' | 'branches'>[]

export interface CSSDirectiveSourceRange {
  start: number
  end: number
}

export interface CSSDirectiveSourceLocation {
  line: number
  column: number
}

export interface CSSDirectiveSourceReference {
  file?: string
  range: CSSDirectiveSourceRange
  loc?: {
    start: CSSDirectiveSourceLocation
    end: CSSDirectiveSourceLocation
  }
}

export interface CSSDirectiveRelatedInformation {
  message: string
  source?: CSSDirectiveSourceReference
}

export class CSSDirectiveError extends Error {
  code: string
  source?: CSSDirectiveSourceReference
  related?: CSSDirectiveRelatedInformation[]

  constructor(
    code: string,
    message: string,
    source?: CSSDirectiveSourceReference,
    related?: CSSDirectiveRelatedInformation[]
  ) {
    super(message)
    this.name = 'CSSDirectiveError'
    this.code = code
    this.source = source
    this.related = related
  }
}

function offsetToLocation(source: string, offset: number): CSSDirectiveSourceLocation {
  let line = 1
  let column = 1
  for (let index = 0; index < offset && index < source.length; index++) {
    if (source[index] === '\n') {
      line++
      column = 1
    } else {
      column++
    }
  }
  return {
    line,
    column
  }
}

export function createCSSDirectiveSourceReference(
  file: string | undefined,
  range: CSSDirectiveSourceRange,
  source?: string
): CSSDirectiveSourceReference {
  return {
    ...(file ? { file } : {}),
    range,
    ...(source
      ? {
        loc: {
          start: offsetToLocation(source, range.start),
          end: offsetToLocation(source, range.end)
        }
      }
      : {})
  }
}

export interface CSSDirectiveVariableDefinition {
  name?: string
  value: CSSDirectiveVariableValue
  mode?: string
  inline?: boolean
  static?: boolean
  namespace?: string
  key?: string
}

export type CSSDirectiveAnimationDefinitions = Record<string, Record<string, CSSDirectiveDeclarations>>

export type CSSDirectiveAnimationOptions = Record<string, { static?: boolean }>

export type CSSDirectiveConditionPathEntry =
  | { type: 'condition'; value: string }
  | { type: 'variant'; token: string }

export interface CSSDirectiveUtilityRuleDefinition {
  declarations: CSSDirectiveDeclarations
  conditions?: string[]
  conditionPath?: CSSDirectiveConditionPathEntry[]
  selector?: string
}

export interface CSSDirectiveUtilityPatternDefinition {
  prefix: string
  values: string[]
}

export interface CSSDirectiveUtilityDynamicDefinition {
  key: string
  variableAliasRefs?: string[]
  kind?: MasterCSSManifestUtilityKind
  values?: string[]
  arbitrary?: boolean
}

export interface CSSDirectiveUtilityDefinition {
  name: string
  type?: 'static' | 'pattern' | 'dynamic'
  layer?: CSSDirectiveLayerName
  pattern?: CSSDirectiveUtilityPatternDefinition
  dynamic?: CSSDirectiveUtilityDynamicDefinition
  declarations?: CSSDirectiveDeclarations
  conditions?: string[]
  conditionPath?: CSSDirectiveConditionPathEntry[]
  rules?: CSSDirectiveUtilityRuleDefinition[]
}

export interface CSSDirectiveManifestInput {
  variants?: CSSDirectiveVariantDefinitions
  variables?: CSSDirectiveVariableDefinition[]
  utilities?: CSSDirectiveUtilityDefinition[]
  rootSize?: number
  baseUnit?: number
  defaultMode?: CSSDirectiveDefaultMode
  scope?: string
  important?: boolean
  animations?: CSSDirectiveAnimationDefinitions
  animationOptions?: CSSDirectiveAnimationOptions
  modes?: string[]
  modeTrigger?: CSSDirectiveModeTrigger
}

export interface CSSDirectiveExtractionPolicy {
  include: string[]
  exclude: string[]
  safelist: string[]
  blocklist: (string | RegExp)[]
  preserveNative: boolean
}

export interface CSSDirectiveReference {
  source: string
  file?: string
}

export interface CSSDirectiveStyleComposeDefinition {
  type: 'compose'
  order: number
  className: string
  selector: string
  source?: CSSDirectiveSourceReference
  directiveSource?: CSSDirectiveSourceReference
  selectorSource?: CSSDirectiveSourceReference
  conditions?: string[]
  conditionPath?: CSSDirectiveConditionPathEntry[]
  layer?: CSSDirectiveLayerName
  name?: string
}

export interface CSSDirectiveStyleNativeDefinition {
  type: 'native'
  order: number
  selector: string
  declarations: CSSDirectiveDeclarations
  source?: CSSDirectiveSourceReference
  selectorSource?: CSSDirectiveSourceReference
  conditions?: string[]
  conditionPath?: CSSDirectiveConditionPathEntry[]
  layer?: CSSDirectiveLayerName
  name?: string
}

export type CSSDirectiveStyleDefinition =
  | CSSDirectiveStyleComposeDefinition
  | CSSDirectiveStyleNativeDefinition

export interface CSSDirectiveResult {
  manifestInput: CSSDirectiveManifestInput
  extractionPolicy: CSSDirectiveExtractionPolicy
  classNames: string[]
  nativeClassNames: string[]
  nativeCSS: string
  css: string
  generatedCSS: string
  warnings: string[]
  dependencies: string[]
  references?: CSSDirectiveReference[]
  styleDefinitions?: CSSDirectiveStyleDefinition[]
}
