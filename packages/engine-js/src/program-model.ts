// The decoded runtime program. Fields mirror the Rust `Program` the binary encodes
// (crates/mastercss-engine/src/program.rs), in camelCase; lookup state that Rust's
// `finish_program` derives is built at decode time.

export interface SourceReference {
  file?: string
  range: { start: number, end: number }
  loc?: { start: { line: number, column: number }, end: { line: number, column: number } }
}

export type ThemeNode =
  | { type: 'rule', prelude: string, children: ThemeNode[] }
  | { type: 'declaration', name: string, value: string, inline: boolean, isStatic: boolean }

export interface KeyframeDefinition {
  id: string
  name: string
  text: string
  containers: { id: string, prelude: string }[]
  /** Delivered by its native stylesheet; never emitted. */
  native: boolean
  safelisted: boolean
  dependencies: string[]
  source?: SourceReference
}

export type MediaQuery =
  | { type: 'true' }
  | { type: 'false' }
  | { type: 'feature', value: string }
  | { type: 'media-type', name: string }
  | { type: 'not', query: MediaQuery }
  | { type: 'and', queries: MediaQuery[] }
  | { type: 'or', queries: MediaQuery[] }

export type MixinValuePart =
  | { type: 'text', value: string }
  | { type: 'function', name: string, value: MixinValuePart[] }

export type MixinNode =
  | { type: 'declaration', property: string, value: MixinValuePart[], source?: SourceReference }
  | { type: 'rule', selector: string, body: MixinNode[] }
  | { type: 'condition', condition: string, body: MixinNode[] }
  | { type: 'apply', name: string, arguments: MixinValuePart[][], contents?: MixinNode[], source?: SourceReference }
  | { type: 'contents', fallback: MixinNode[] }

export const MIXIN_PARAMETER_SYNTAXES = ['integer', 'number', 'string', 'custom-ident'] as const
export type MixinParameterSyntax = typeof MIXIN_PARAMETER_SYNTAXES[number]

export interface MixinDefinition {
  name: string
  parameters: { name: string, syntax?: MixinParameterSyntax, default?: string, source?: SourceReference }[]
  body: MixinNode[]
  source?: SourceReference
}

export const UTILITY_KINDS = ['static', 'token', 'function'] as const
export interface RecipeDefinition {
  kind: typeof UTILITY_KINDS[number]
  recipe: MixinDefinition
}

export interface TokenFamily {
  utility: string
  prefix: string
  namespace: string
  argument: 'value' | 'key'
  properties: string[]
}

/** A compiled variable. Declaration order is `Program.variableOrder`. */
export interface Variable {
  name: string
  key: string
  namespace: string
  values: { path: string[], value: string, inline: boolean, isStatic: boolean }[]
  numeric?: { value: number, unit: string }
  variableType: string
  dependencies: string[]
  /** The inline value a `var()` reference is replaced with, when the variable is inlined. */
  inlineValue?: string
  isStatic: boolean
}

export const UTILITY_LAYERS = ['base', 'defaults', 'components', 'utilities'] as const
export type UtilityLayer = typeof UTILITY_LAYERS[number]

export type UtilityMatcher =
  | { type: 'static', name: string }
  | { type: 'token', prefix: string }
  | { type: 'function', name: string }

export type UtilityEmit =
  | { type: 'recipe', definition: number, key: boolean }
  | { type: 'property', property: string }

export interface Utility {
  id: string
  name: string
  /** `-2` for recipes and `0` for property utilities; equal priorities sort on it. */
  utilityType: number
  /** The `~namespace` references a token key resolves through, in order. */
  variableAliasRefs: string[]
  /** The utility of a `(property:value)` head, which programs never register. */
  nativeFallback: boolean
  emit: UtilityEmit
  matchers: UtilityMatcher[]
}

export interface Program {
  theme: ThemeNode[]
  keyframes: KeyframeDefinition[]
  animationVariables: Map<string, string[]>
  customMedia: Map<string, MediaQuery>
  /** The native media branches of each named custom media query: a disjunction of conjunctions. */
  customMediaPaths: Map<string, string[][]>
  mixins: MixinDefinition[]
  utilityDefinitions: RecipeDefinition[]
  tokenFamilies: TokenFamily[]
  variables: Map<string, Variable>
  variableOrder: string[]
  hasInlineTokens: boolean
  /** Registered utilities in priority order; static ones first. */
  utilities: Utility[]
  staticUtilities: Map<string, number[]>
  tokenUtilities: Map<string, number[]>
  functionUtilities: Map<string, number>
  /** Token prefixes bucketed by first character, longest first, for prefix matching. */
  tokenPrefixes: Map<string, string[]>
}

export type ProgramErrorCode = 'INVALID_PROGRAM' | 'UNSUPPORTED_PROGRAM_VERSION'
export interface ProgramError {
  code: ProgramErrorCode
  message: string
}

export type DecodeResult = { ok: true, program: Program } | { ok: false, error: ProgramError }
