import type { PropertiesHyphen } from 'csstype'
import type { UtilityType } from './utility-type.js'

export type MasterCSSPlanUtilityLayerName = 'base' | 'defaults' | 'components' | 'utilities'
export type MasterCSSPlanDefaultMode = 'light' | 'dark' | 'none' | string
export type MasterCSSPlanModeTrigger = 'class' | 'media' | 'host'
export type MasterCSSPlanVariantToken = `:${string}` | `::${string}` | `@${string}`
export type MasterCSSPlanUtilityKind = 'number' | 'color' | 'image'
export type MasterCSSPlanTransformOp = 'auto-fill-solid' | 'animation-token'
export type MasterCSSPlanFunctionOp = 'core.math' | 'core.variable'

export type MasterCSSPlanCSSDeclarationPrimitive = string | number | undefined
export type MasterCSSPlanCSSDeclarations = PropertiesHyphen | Record<string, MasterCSSPlanCSSDeclarationPrimitive | MasterCSSPlanCSSDeclarationPrimitive[]>
export type MasterCSSPlanVariableValue = number | string | false | (number | string)[]

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
    key: string
    namespace?: string
    value: MasterCSSPlanVariableValue
    mode?: string
    inline?: boolean
}

export type MasterCSSPlanVariables = MasterCSSPlanVariable[]

export type MasterCSSPlanKeyframes<TDeclarations = MasterCSSPlanCSSDeclarations> = Record<'from' | 'to' | string, TDeclarations>
export type MasterCSSPlanAnimations<TDeclarations = MasterCSSPlanCSSDeclarations> = Record<string, MasterCSSPlanKeyframes<TDeclarations>>

export interface MasterCSSPlanVariantBranch {
    selector?: string
    atRules?: string[]
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

export type MasterCSSPlanUtilityMatcher =
    | { type: 'static'; name: string }
    | { type: 'key'; keys: string[] }
    | { type: 'variable'; keys: string[] }
    | { type: 'value'; keys: string[] }
    | { type: 'function-prefix'; name: string }
    | { type: 'group' }
    | { type: 'css-variable-assignment' }

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
    emit: MasterCSSPlanUtilityEmit
    matchers: MasterCSSPlanUtilityMatcher[]
    debug?: Record<string, unknown>
}

export type MasterCSSPlanUtilities = MasterCSSPlanUtility[]

export interface MasterCSSPlan {
    version: 1
    settings?: MasterCSSPlanSettings
    variables?: MasterCSSPlanVariables
    animations?: MasterCSSPlanAnimations
    variants?: MasterCSSPlanVariants
    atRules?: Record<string, string>
    utilities?: MasterCSSPlanUtilities
    functions?: MasterCSSPlanFunctions
    debug?: Record<string, unknown>
}
