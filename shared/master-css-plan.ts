import type { PropertiesHyphen } from 'csstype'
import type { UtilityType } from './utility-type.js'

export type MasterCSSPlanAtIdentifier = 'container' | 'starting-style' | 'supports' | 'media' | 'layer'
export type MasterCSSPlanUtilityLayerName = 'base' | 'defaults' | 'components' | 'utilities'
export type MasterCSSPlanDefaultMode = 'light' | 'dark' | 'none' | string
export type MasterCSSPlanModeTrigger = 'class' | 'media' | 'host'
export type MasterCSSPlanVariantToken = `:${string}` | `::${string}` | `@${string}`
export type MasterCSSPlanUtilityKind = 'number' | 'color' | 'image'
export type MasterCSSPlanTransformOp = 'auto-fill-solid' | 'animation-token'
export type MasterCSSPlanFunctionOp = 'core.math' | 'core.variable'
/** Defaults to single for variable/value matchers; multiple is an explicit opt-in. */
export type MasterCSSPlanUtilityMatcherValueSegments = 'single' | 'multiple'

export type MasterCSSPlanCSSDeclarationPrimitive = string | number | null
export type MasterCSSPlanCSSDeclarations = PropertiesHyphen | Record<string, MasterCSSPlanCSSDeclarationPrimitive | MasterCSSPlanCSSDeclarationPrimitive[]>
export type MasterCSSPlanVariableValue = number | string | false | (number | string)[]
export type MasterCSSPlanVariableType = 'number' | 'string'
export interface MasterCSSPlanVariableNumericValue {
    value: number
    unit?: string
}

export type MasterCSSPlanAtRuleBooleanNode = { raw?: string, name: string, type: 'boolean' }
export type MasterCSSPlanAtRuleNumberNode = { raw?: string, name?: string, type: 'number', value: number, unit?: string, operator?: string }
export type MasterCSSPlanAtRuleStringNode = { raw?: string, name?: string, type: 'string', value: string }
export type MasterCSSPlanAtRuleValueNode = MasterCSSPlanAtRuleNumberNode | MasterCSSPlanAtRuleStringNode
export interface MasterCSSPlanAtRuleComparisonOperatorNode { type: 'comparison', raw?: string, value: string }
export interface MasterCSSPlanAtRuleLogicalOperatorNode { type: 'logical', raw?: string, value: string }
export type MasterCSSPlanAtRuleOperatorNode = MasterCSSPlanAtRuleComparisonOperatorNode | MasterCSSPlanAtRuleLogicalOperatorNode
export interface MasterCSSPlanAtRuleGroupNode { type?: 'group', raw?: string, children: MasterCSSPlanAtRuleNode[] }
export type MasterCSSPlanAtRuleNode =
    | MasterCSSPlanAtRuleBooleanNode
    | MasterCSSPlanAtRuleValueNode
    | MasterCSSPlanAtRuleComparisonOperatorNode
    | MasterCSSPlanAtRuleLogicalOperatorNode
    | MasterCSSPlanAtRuleGroupNode

export interface MasterCSSPlanAtRule {
    id: MasterCSSPlanAtIdentifier
    nodes: MasterCSSPlanAtRuleNode[]
}

export type MasterCSSPlanAtRules = Record<string, MasterCSSPlanAtRule>

export type MasterCSSPlanSelectorLiteralNode = {
    type?: 'attribute' | 'pseudo-class' | 'pseudo-element' | 'class' | 'universal' | 'id'
    raw?: string
    value?: string
    children?: MasterCSSPlanSelectorNode[]
}

export type MasterCSSPlanSelectorSeparatorNode = {
    type: 'separator'
    raw?: string
    value: string
}

export type MasterCSSPlanSelectorCombinatorNode = {
    type: 'combinator'
    raw?: string
    value: string
}

export type MasterCSSPlanSelectorNode =
    | MasterCSSPlanSelectorLiteralNode
    | MasterCSSPlanSelectorCombinatorNode
    | MasterCSSPlanSelectorSeparatorNode

export type MasterCSSPlanSelectors = Record<string, MasterCSSPlanSelectorNode[]>

export interface MasterCSSPlanSettings {
    rootSize?: number
    baseUnit?: number
    defaultMode?: MasterCSSPlanDefaultMode
    scope?: string
    important?: boolean
    modeTrigger?: MasterCSSPlanModeTrigger
    modes?: string[]
}

export interface MasterCSSPlanVariable {
    name?: string
    key: string
    namespace?: string
    type?: MasterCSSPlanVariableType
    value?: MasterCSSPlanVariableValue
    numeric?: MasterCSSPlanVariableNumericValue
    modes?: Record<string, { type: MasterCSSPlanVariableType, value: number | string, numeric?: MasterCSSPlanVariableNumericValue }>
    dependencies?: string[]
    mode?: string
    inline?: boolean
    static?: boolean
}

export type MasterCSSPlanVariables = MasterCSSPlanVariable[]

export type MasterCSSPlanKeyframes<TDeclarations = MasterCSSPlanCSSDeclarations> = Record<'from' | 'to' | string, TDeclarations>
export type MasterCSSPlanAnimations<TDeclarations = MasterCSSPlanCSSDeclarations> = Record<string, MasterCSSPlanKeyframes<TDeclarations>>
export type MasterCSSPlanAnimationOptions = Record<string, { static?: boolean }>

export interface MasterCSSPlanVariantBranch {
    selector?: string
    selectorNodes?: MasterCSSPlanSelectorNode[]
    atRules?: string[]
    atRuleNodes?: MasterCSSPlanAtRule[]
    layer?: MasterCSSPlanUtilityLayerName
}

export interface MasterCSSPlanVariant {
    token: MasterCSSPlanVariantToken
    branches: MasterCSSPlanVariantBranch[]
}

export type MasterCSSPlanVariants = MasterCSSPlanVariant[]

export interface MasterCSSPlanFunction {
    unit?: string
    op?: MasterCSSPlanFunctionOp
    options?: unknown
}

export type MasterCSSPlanFunctions = Record<string, MasterCSSPlanFunction>
export type MasterCSSPlanKeyAliases = Record<string, string>

export interface MasterCSSPlanNativeValueNamespace {
    properties: string[]
    variableAliasRefs: string[]
    unit?: string
}

export type MasterCSSPlanNativeValueNamespaces = MasterCSSPlanNativeValueNamespace[]

export type MasterCSSPlanUtilityMatcher =
    | { type: 'static'; name: string }
    | { type: 'key'; keys: string[] }
    | { type: 'variable'; keys: string[]; segments?: MasterCSSPlanUtilityMatcherValueSegments }
    | { type: 'value'; keys: string[]; segments?: MasterCSSPlanUtilityMatcherValueSegments }
    | { type: 'function-prefix'; name: string }
    | { type: 'group' }
    | { type: 'css-variable-assignment' }

export interface MasterCSSPlanUtilityBuckets {
    variable?: number[]
    value?: number[]
    key?: number[]
    arbitrary?: number[]
}

export type MasterCSSPlanVariableAlias = [key: string, name: string]
export type MasterCSSPlanVariableAliasSet = MasterCSSPlanVariableAlias[]

export type MasterCSSPlanUtilityEmit =
    | { type: 'declarations'; declarations: string[] }
    | { type: 'template'; declarations: MasterCSSPlanCSSDeclarations }
    | { type: 'property'; property: string }
    | { type: 'pair'; properties: [string, string] }
    | { type: 'group' }
    | { type: 'css-variable-assignment' }
    | { type: 'static'; rules: MasterCSSPlanUtilityRule[] }

export interface MasterCSSPlanUtilityRule<TDeclarations = MasterCSSPlanCSSDeclarations> {
    declarations: TDeclarations
    atRules?: string[]
    selector?: string
}

export interface MasterCSSPlanUtility {
    id: string
    name: string
    type: UtilityType
    order: number
    layer?: MasterCSSPlanUtilityLayerName
    key?: string
    subkey?: string
    keys?: string[]
    aliasGroups?: string[]
    values?: string[]
    kind?: MasterCSSPlanUtilityKind
    namespaces?: string[]
    implicitNamespace?: boolean
    separators?: string[]
    unit?: string
    includeAnimations?: boolean
    atRules?: string[]
    transform?: MasterCSSPlanTransformOp
    variableAliases?: MasterCSSPlanVariableAliasSet
    variableAliasRefs?: string[]
    emit: MasterCSSPlanUtilityEmit
    matchers: MasterCSSPlanUtilityMatcher[]
    debug?: Record<string, unknown>
}

export type MasterCSSPlanUtilities = MasterCSSPlanUtility[]

export interface MasterCSSPlan {
    /**
     * MasterCSSPlan IR schema/codec version.
     * This is not a legacy Config compatibility marker; engines must reject
     * unsupported plan versions instead of migrating authoring APIs at runtime.
     */
    version: 2
    settings?: MasterCSSPlanSettings
    variables?: MasterCSSPlanVariables
    animations?: MasterCSSPlanAnimations
    animationOptions?: MasterCSSPlanAnimationOptions
    variants?: MasterCSSPlanVariants
    atRules?: MasterCSSPlanAtRules
    breakpointAtRules?: MasterCSSPlanAtRules
    containerAtRules?: MasterCSSPlanAtRules
    selectors?: MasterCSSPlanSelectors
    utilities?: MasterCSSPlanUtilities
    utilityBuckets?: MasterCSSPlanUtilityBuckets
    functions?: MasterCSSPlanFunctions
    keyAliases?: MasterCSSPlanKeyAliases
    nativeValueNamespaces?: MasterCSSPlanNativeValueNamespaces
    debug?: Record<string, unknown>
}
