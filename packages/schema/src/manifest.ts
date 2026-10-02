import type { MasterCSSKeyframeDefinition } from './keyframes.js'
export type { MasterCSSKeyframeDefinition } from './keyframes.js'
import type { PropertiesHyphen } from 'csstype'
import type { MasterCSSMixinDefinition } from './mixin.js'
export type {
  MasterCSSMixinDefinition,
  MasterCSSMixinParameter,
  MasterCSSMixinParameterSyntax,
  MasterCSSMixinNode,
  MasterCSSMixinValue
} from './mixin.js'

export type MasterCSSManifestConditionIdentifier = 'container' | 'starting-style' | 'supports' | 'media' | 'layer'
export type MasterCSSManifestUtilityLayerName = 'base' | 'defaults' | 'components' | 'utilities'

export type MasterCSSManifestCSSDeclarationPrimitive = string | number | null
export type MasterCSSManifestCSSDeclarations = PropertiesHyphen | Record<string, MasterCSSManifestCSSDeclarationPrimitive | MasterCSSManifestCSSDeclarationPrimitive[]>
export type MasterCSSManifestVariableValue = number | string | false | (number | string)[]
export type MasterCSSManifestVariableType = 'number' | 'string'
export interface MasterCSSManifestVariableNumericValue {
  value: number
  unit?: string
}

export interface MasterCSSManifestVariable {
  name?: string
  key: string
  namespace?: string
  type?: MasterCSSManifestVariableType
  values: MasterCSSScopedThemeValue[]
  numeric?: MasterCSSManifestVariableNumericValue
  dependencies?: string[]
}

export type MasterCSSManifestVariables = Record<string, MasterCSSManifestVariable[]>
export type MasterCSSManifestVariableEntry = MasterCSSManifestVariable & {
  name: string
  namespace?: string
  type: MasterCSSManifestVariableType
}

export interface MasterCSSScopedThemeValue {
  path: string[]
  value: string
  inline?: boolean
  static?: boolean
}

export type MasterCSSThemeNode =
  | { type: 'rule'; prelude: string; children: MasterCSSThemeNode[] }
  | { type: 'declaration'; name: string; value: string; inline?: boolean; static?: boolean }

export type MasterCSSMediaQueryExpression =
  | { type: 'true' | 'false' }
  | { type: 'feature'; value: string }
  | { type: 'media-type'; name: string }
  | { type: 'not'; query: MasterCSSMediaQueryExpression }
  | { type: 'and' | 'or'; queries: MasterCSSMediaQueryExpression[] }

export interface MasterCSSManifest {
  /**
   * MasterCSSManifest IR schema/codec version.
   * This is not a legacy Config compatibility marker; engines must reject
   * unsupported manifest versions instead of migrating authoring APIs at runtime.
   */
  version: 5
  languageVersion: 14
  keyframes?: MasterCSSKeyframeDefinition[]
  animationVariables?: Record<string, string[]>
  theme?: MasterCSSThemeNode[]
  customMedia?: Record<string, MasterCSSMediaQueryExpression>
  variables?: MasterCSSManifestVariables
  mixins?: MasterCSSMixinDefinition[]
  debug?: Record<string, unknown>
}

export function getMasterCSSManifestVariableName(namespace: string, variable: Pick<MasterCSSManifestVariable, 'key' | 'name'>) {
  return variable.name || (namespace ? `${namespace}${variable.key ? '-' + variable.key : ''}` : variable.key)
}

export function flattenMasterCSSManifestVariables(
  variables: MasterCSSManifestVariables | undefined
): MasterCSSManifestVariableEntry[] {
  const flattened: MasterCSSManifestVariableEntry[] = []
  for (const [namespace, definitions] of Object.entries(variables || {})) {
    for (const definition of definitions) {
      const type = definition.type || 'string'
      flattened.push({
        ...definition,
        name: getMasterCSSManifestVariableName(namespace, definition),
        ...(namespace ? { namespace } : {}),
        type
      })
    }
  }
  return flattened
}

export function groupMasterCSSManifestVariables(
  variables: readonly MasterCSSManifestVariable[] | undefined
): MasterCSSManifestVariables | undefined {
  if (!variables?.length) return
  const grouped: MasterCSSManifestVariables = {}
  for (const variable of variables) {
    const namespace = variable.namespace || ''
    const group = grouped[namespace] ||= []
    const { namespace: _namespace, ...definition } = variable
    group.push(definition)
  }
  return Object.keys(grouped).length ? grouped : undefined
}

export {
  normalizeMasterCSSManifest,
  serializeMasterCSSManifest
} from './manifest-json'
