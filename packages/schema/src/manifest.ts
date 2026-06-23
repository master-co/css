import type { PropertiesHyphen } from 'csstype'
import type { UtilityType } from './utility-type.js'

export type MasterCSSManifestAtIdentifier = 'container' | 'starting-style' | 'supports' | 'media' | 'layer'
export type MasterCSSManifestUtilityLayerName = 'base' | 'defaults' | 'components' | 'utilities'
export type MasterCSSManifestDefaultMode = 'light' | 'dark' | 'none' | string
export type MasterCSSManifestModeTrigger = 'class' | 'media' | 'host'
export type MasterCSSManifestVariantToken = `:${string}` | `::${string}` | `@${string}`
export type MasterCSSManifestUtilityKind = 'number' | 'color' | 'image'
/** Defaults to single for variable/value matchers; multiple is an explicit opt-in. */
export type MasterCSSManifestUtilityMatcherValueSegments = 'single' | 'multiple'

export type MasterCSSManifestCSSDeclarationPrimitive = string | number | null
export type MasterCSSManifestCSSDeclarations = PropertiesHyphen | Record<string, MasterCSSManifestCSSDeclarationPrimitive | MasterCSSManifestCSSDeclarationPrimitive[]>
export type MasterCSSManifestVariableValue = number | string | false | (number | string)[]
export type MasterCSSManifestVariableType = 'number' | 'string'
export interface MasterCSSManifestVariableNumericValue {
    value: number
    unit?: string
}

export interface MasterCSSManifestAtRuleBooleanNode { raw?: string, name: string, type: 'boolean' }
export interface MasterCSSManifestAtRuleNumberNode { raw?: string, name?: string, type: 'number', value: number, unit?: string, operator?: string }
export interface MasterCSSManifestAtRuleStringNode { raw?: string, name?: string, type: 'string', value: string }
export type MasterCSSManifestAtRuleValueNode = MasterCSSManifestAtRuleNumberNode | MasterCSSManifestAtRuleStringNode
export interface MasterCSSManifestAtRuleComparisonOperatorNode { type: 'comparison', raw?: string, value: string }
export interface MasterCSSManifestAtRuleLogicalOperatorNode { type: 'logical', raw?: string, value: string }
export type MasterCSSManifestAtRuleOperatorNode = MasterCSSManifestAtRuleComparisonOperatorNode | MasterCSSManifestAtRuleLogicalOperatorNode
export interface MasterCSSManifestAtRuleGroupNode { type?: 'group', raw?: string, children: MasterCSSManifestAtRuleNode[] }
export type MasterCSSManifestAtRuleNode =
    | MasterCSSManifestAtRuleBooleanNode
    | MasterCSSManifestAtRuleValueNode
    | MasterCSSManifestAtRuleComparisonOperatorNode
    | MasterCSSManifestAtRuleLogicalOperatorNode
    | MasterCSSManifestAtRuleGroupNode

export interface MasterCSSManifestAtRule {
    id: MasterCSSManifestAtIdentifier
    nodes: MasterCSSManifestAtRuleNode[]
}

export type MasterCSSManifestAtRules = Record<string, MasterCSSManifestAtRule>

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

export interface MasterCSSManifestSettings {
    rootSize?: number
    baseUnit?: number
    defaultMode?: MasterCSSManifestDefaultMode
    scope?: string
    important?: boolean
    modeTrigger?: MasterCSSManifestModeTrigger
    modes?: string[]
}

export interface MasterCSSManifestVariable {
    name?: string
    key: string
    namespace?: string
    type?: MasterCSSManifestVariableType
    value?: MasterCSSManifestVariableValue
    numeric?: MasterCSSManifestVariableNumericValue
    modes?: Record<string, { type: MasterCSSManifestVariableType, value: number | string, numeric?: MasterCSSManifestVariableNumericValue }>
    dependencies?: string[]
    mode?: string
    inline?: boolean
    static?: boolean
}

export type MasterCSSManifestVariables = Record<string, MasterCSSManifestVariable[]>
export type MasterCSSManifestVariableEntry = MasterCSSManifestVariable & {
    name: string
    namespace?: string
    type: MasterCSSManifestVariableType
}

export type MasterCSSManifestKeyframes<TDeclarations = MasterCSSManifestCSSDeclarations> = Record<'from' | 'to' | string, TDeclarations>
export type MasterCSSManifestAnimations<TDeclarations = MasterCSSManifestCSSDeclarations> = Record<string, MasterCSSManifestKeyframes<TDeclarations>>
export type MasterCSSManifestAnimationOptions = Record<string, { static?: boolean }>

export interface MasterCSSManifestVariantBranch {
    selector?: string
    selectorNodes?: MasterCSSManifestSelectorNode[]
    atRules?: string[]
    atRuleNodes?: MasterCSSManifestAtRule[]
    layer?: MasterCSSManifestUtilityLayerName
}

export interface MasterCSSManifestVariant {
    token: MasterCSSManifestVariantToken
    branches: MasterCSSManifestVariantBranch[]
}

export type MasterCSSManifestVariants = MasterCSSManifestVariant[]

export type MasterCSSManifestUtilityMatcher =
    | { type: 'static'; name: string }
    | { type: 'pattern'; prefix: string; values: string[] }
    | { type: 'key'; keys: string[] }
    | { type: 'variable'; keys: string[]; segments?: MasterCSSManifestUtilityMatcherValueSegments }
    | { type: 'value'; keys: string[]; segments?: MasterCSSManifestUtilityMatcherValueSegments }

export type MasterCSSManifestVariableAlias = [key: string, name: string]
export type MasterCSSManifestVariableAliasSet = MasterCSSManifestVariableAlias[]

export type MasterCSSManifestUtilityEmit =
    | { type: 'declarations'; declarations: string[] }
    | { type: 'template'; declarations: MasterCSSManifestCSSDeclarations }
    | { type: 'property'; property: string }
    | { type: 'static'; rules: MasterCSSManifestUtilityRule[] }

export interface MasterCSSManifestUtilityRule<TDeclarations = MasterCSSManifestCSSDeclarations> {
    declarations: TDeclarations
    atRules?: string[]
    selector?: string
}

export interface MasterCSSManifestUtility {
    id: string
    name?: string
    type: UtilityType
    order?: number
    layer?: MasterCSSManifestUtilityLayerName
    key?: string
    subkey?: string
    keys?: string[]
    aliasGroups?: string[]
    kind?: MasterCSSManifestUtilityKind
    namespaces?: string[]
    implicitNamespace?: boolean
    separators?: string[]
    atRules?: string[]
    variableAliases?: MasterCSSManifestVariableAliasSet
    variableAliasRefs?: string[]
    emit: MasterCSSManifestUtilityEmit
    matchers: MasterCSSManifestUtilityMatcher[]
    debug?: Record<string, unknown>
}

export type MasterCSSManifestUtilities = MasterCSSManifestUtility[]

export interface MasterCSSManifest {
    /**
     * MasterCSSManifest IR schema/codec version.
     * This is not a legacy Config compatibility marker; engines must reject
     * unsupported manifest versions instead of migrating authoring APIs at runtime.
     */
    version: 1
    settings?: MasterCSSManifestSettings
    variables?: MasterCSSManifestVariables
    animations?: MasterCSSManifestAnimations
    animationOptions?: MasterCSSManifestAnimationOptions
    variants?: MasterCSSManifestVariants
    atRules?: MasterCSSManifestAtRules
    breakpointAtRules?: MasterCSSManifestAtRules
    containerAtRules?: MasterCSSManifestAtRules
    selectors?: MasterCSSManifestSelectors
    utilities?: MasterCSSManifestUtilities
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
            const type = definition.type || (typeof definition.value === 'number' ? 'number' : 'string')
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
