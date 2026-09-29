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
export type MasterCSSManifestVariantToken = `:${string}` | `::${string}` | `@${string}`

export type MasterCSSManifestCSSDeclarationPrimitive = string | number | null
export type MasterCSSManifestCSSDeclarations = PropertiesHyphen | Record<string, MasterCSSManifestCSSDeclarationPrimitive | MasterCSSManifestCSSDeclarationPrimitive[]>
export type MasterCSSManifestVariableValue = number | string | false | (number | string)[]
export type MasterCSSManifestVariableType = 'number' | 'string'
export interface MasterCSSManifestVariableNumericValue {
  value: number
  unit?: string
}

export interface MasterCSSManifestConditionBooleanNode { raw?: string, name: string, type: 'boolean' }
export interface MasterCSSManifestConditionNumberNode { raw?: string, name?: string, type: 'number', value: number, unit?: string, operator?: string }
export interface MasterCSSManifestConditionStringNode { raw?: string, name?: string, type: 'string', value: string }
export type MasterCSSManifestConditionValueNode = MasterCSSManifestConditionNumberNode | MasterCSSManifestConditionStringNode
export interface MasterCSSManifestConditionComparisonOperatorNode { type: 'comparison', raw?: string, value: string }
export interface MasterCSSManifestConditionLogicalOperatorNode { type: 'logical', raw?: string, value: string }
export type MasterCSSManifestConditionOperatorNode = MasterCSSManifestConditionComparisonOperatorNode | MasterCSSManifestConditionLogicalOperatorNode
export interface MasterCSSManifestConditionGroupNode { type?: 'group', raw?: string, children: MasterCSSManifestConditionNode[] }
export type MasterCSSManifestConditionNode =
  | MasterCSSManifestConditionBooleanNode
  | MasterCSSManifestConditionValueNode
  | MasterCSSManifestConditionComparisonOperatorNode
  | MasterCSSManifestConditionLogicalOperatorNode
  | MasterCSSManifestConditionGroupNode

export interface MasterCSSManifestCondition {
  id: MasterCSSManifestConditionIdentifier
  nodes: MasterCSSManifestConditionNode[]
}

export type MasterCSSManifestConditions = Record<string, MasterCSSManifestCondition>

export interface MasterCSSManifestSelectorLiteralNode {
  type?: 'attribute' | 'pseudo-class' | 'pseudo-element' | 'class' | 'universal' | 'id'
  raw?: string
  value?: string
  children?: MasterCSSManifestSelectorNode[]
}

export interface MasterCSSManifestSelectorSeparatorNode {
  type: 'separator'
  raw?: string
  value: string
}

export interface MasterCSSManifestSelectorCombinatorNode {
  type: 'combinator'
  raw?: string
  value: string
}

export type MasterCSSManifestSelectorNode =
  | MasterCSSManifestSelectorLiteralNode
  | MasterCSSManifestSelectorCombinatorNode
  | MasterCSSManifestSelectorSeparatorNode

export type MasterCSSManifestSelectors = Record<string, MasterCSSManifestSelectorNode[]>

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

export interface MasterCSSManifestVariantBranch {
  selector?: string
  selectorNodes?: MasterCSSManifestSelectorNode[]
  conditions?: string[]
  conditionNodes?: MasterCSSManifestCondition[]
  layer?: MasterCSSManifestUtilityLayerName
}

export interface MasterCSSManifestVariant {
  token: MasterCSSManifestVariantToken
  branches: MasterCSSManifestVariantBranch[]
}

export type MasterCSSManifestVariants = MasterCSSManifestVariant[]

export interface MasterCSSScopedThemeValue {
  path: string[]
  value: string
}

export type MasterCSSThemeNode =
  | { type: 'rule'; prelude: string; children: MasterCSSThemeNode[] }
  | { type: 'declaration'; name: string; value: string }

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
  version: 3
  languageVersion: 5
  theme?: MasterCSSThemeNode[]
  customMedia?: Record<string, MasterCSSMediaQueryExpression>
  variables?: MasterCSSManifestVariables
  variants?: MasterCSSManifestVariants
  conditions?: MasterCSSManifestConditions
  containerConditions?: MasterCSSManifestConditions
  selectors?: MasterCSSManifestSelectors
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
