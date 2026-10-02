import type { MasterCSSKeyframeDefinition } from './keyframes.js'
import type { MasterCSSMixinDefinition, MasterCSSUtilityDefinition, MasterCSSMixinValue, MasterCSSMixinNode } from './mixin.js'
import type {
  MasterCSSThemeNode,
  MasterCSSManifestUtilityLayerName
} from './manifest.js'

export type CSSDirectiveVariableValue = number | string | false | (number | string)[]

export type CSSDirectiveDeclarations = Record<string, string>

export type CSSDirectiveLayerName = MasterCSSManifestUtilityLayerName




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

export interface CSSCustomMediaDefinition {
  name: string
  query: string
  source?: CSSDirectiveSourceReference
}

export type CSSDirectiveConditionPathEntry =
  | { type: 'condition'; value: string }

export interface CSSDirectiveManifestInput {
  keyframes?: MasterCSSKeyframeDefinition[]
  keyframeSafelist?: string[]
  animationVariables?: Record<string, string[]>
  theme?: MasterCSSThemeNode[]
  customMedia?: CSSCustomMediaDefinition[]
  mixins?: MasterCSSMixinDefinition[]
  utilities?: MasterCSSUtilityDefinition[]
}

export interface CSSDirectiveExtractionPolicy {
  include: string[]
  exclude: string[]
  safelist: string[]
  safelistKeyframes: string[]
  blocklist: (string | RegExp)[]
  preserveNative: boolean
  pruneNative: boolean
}

export interface CSSDirectiveReference {
  source: string
  file?: string
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

export interface CSSDirectiveStyleApplyDefinition {
  type: 'apply'
  order: number
  selector: string
  name: string
  arguments: MasterCSSMixinValue[]
  contents?: MasterCSSMixinNode[]
  selectorSource?: CSSDirectiveSourceReference
  source?: CSSDirectiveSourceReference
  conditionPath?: CSSDirectiveConditionPathEntry[]
}

export type CSSDirectiveStyleDefinition =
  | CSSDirectiveStyleApplyDefinition
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

export interface CSSDefinitionSource {
  kind: 'utility' | 'mixin'
  name: string
  identity: string
  replacedBy?: CSSDirectiveSourceReference
  source: CSSDirectiveSourceReference
}

export interface CSSDirectiveNotice {
  code: string
  message: string
  source?: CSSDirectiveSourceReference | null
}

export interface CSSDirectiveResult {
  suppressedKeyframes?: string[]
  notices?: CSSDirectiveNotice[]
  definitionSources?: CSSDefinitionSource[]
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
