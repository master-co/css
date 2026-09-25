import type {
  MasterCSSManifestMode,
  MasterCSSManifestUtilityKind,
  MasterCSSManifestUtilityLayerName,
  MasterCSSManifestVariant
} from './manifest.js'

export type CSSDirectiveVariableValue = number | string | false | (number | string)[]

export type CSSDirectiveDeclarations = Record<string, string>

export type CSSDirectiveLayerName = MasterCSSManifestUtilityLayerName



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
  valueMap?: Record<string, string>
}

export interface CSSDirectiveUtilityDynamicDefinition {
  key: string
  kind?: MasterCSSManifestUtilityKind
  values?: string[]
  arbitrary?: boolean
}

export interface CSSDirectiveUtilityTokenDefinition {
  prefix: string
  variableAliasRefs: string[]
}

export interface CSSDirectiveUtilityDefinition {
  name: string
  type?: 'static' | 'pattern' | 'dynamic' | 'token'
  layer?: CSSDirectiveLayerName
  pattern?: CSSDirectiveUtilityPatternDefinition
  dynamic?: CSSDirectiveUtilityDynamicDefinition
  token?: CSSDirectiveUtilityTokenDefinition
  declarations?: CSSDirectiveDeclarations
  conditions?: string[]
  conditionPath?: CSSDirectiveConditionPathEntry[]
  rules?: CSSDirectiveUtilityRuleDefinition[]
}

export interface CSSDirectiveManifestInput {
  variants?: CSSDirectiveVariantDefinitions
  variables?: CSSDirectiveVariableDefinition[]
  utilities?: CSSDirectiveUtilityDefinition[]
  scope?: string
  important?: boolean
  animations?: CSSDirectiveAnimationDefinitions
  animationOptions?: CSSDirectiveAnimationOptions
  modes?: MasterCSSManifestMode[]
}

export interface CSSDirectiveExtractionPolicy {
  include: string[]
  exclude: string[]
  safelist: string[]
  blocklist: (string | RegExp)[]
  preserveNative: boolean
  pruneNative: boolean
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

export interface CSSOrderedDeclaration {
  property: string
  value: string
  source?: CSSDirectiveSourceReference
}

export interface CSSDirectiveStyleNativeDefinition {
  type: 'native'
  order: number
  selector: string
  declarations: CSSOrderedDeclaration[]
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

/** Generated UTF-16 offset and its original authoring-source anchor. */
export interface CSSOutputMapping {
  generatedStart: number
  generatedEnd?: number
  source: CSSDirectiveSourceReference
}

/** Rust output plan; pass it unchanged from parsing to directive lowering. */
export interface CSSNativeOutput {
  css: string
  mappings: CSSOutputMapping[]
  slots: { start: number, end: number, marker: string, definitions: CSSDirectiveStyleDefinition[] }[]
}

export interface CSSUtilitySource {
  name: string
  source: CSSDirectiveSourceReference
}

export interface CSSCompositionTrace {
  order: number
  classes: string[]
  source?: CSSDirectiveSourceReference
  definitionSources: CSSDirectiveSourceReference[]
  css: string
  variableNames: string[]
  animationNames: string[]
}

export interface CSSDirectiveResult {
  utilitySources?: CSSUtilitySource[]
  compositions?: CSSCompositionTrace[]
  nativeOutput?: CSSNativeOutput
  outputMappings?: CSSOutputMapping[]
  /** Serialized source map v3 for the final CSS, when produced by the stylesheet host. */
  sourceMap?: string
  nativeMappings?: CSSOutputMapping[]
  generatedMappings?: CSSOutputMapping[]
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
