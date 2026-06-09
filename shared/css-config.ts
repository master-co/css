import type { UtilityType } from './utility-type.js'
import type { PropertiesHyphen } from 'csstype'

export const CSS_AT_IDENTIFIERS = ['container', 'starting-style', 'supports', 'media', 'layer']

export type CSSDeclarationPrimitive = string | number | undefined
export type CSSDeclarations = PropertiesHyphen | Record<string, CSSDeclarationPrimitive | CSSDeclarationPrimitive[]>

export type VariableValue = number | string | false | (number | string)[]

export interface VariableDefinition {
    key: string
    namespace?: string
    value: VariableValue
    mode?: string
    inline?: boolean
}

export type CSSKeyframes<TDeclarations = CSSDeclarations> = Record<'from' | 'to' | string, TDeclarations>
export type AnimationDefinitions<TDeclarations = CSSDeclarations> = Record<string, CSSKeyframes<TDeclarations>>
export type SelectorTokenDefinitions = Record<string, string>
export type AtIdentifier = typeof CSS_AT_IDENTIFIERS[number]
export type AtTokenDefinition = number | string
export type UtilityLayerName = 'base' | 'defaults' | 'components' | 'utilities'

export interface AtTokenDefinitions {
    [key: string]: AtTokenDefinition | AtTokenDefinitions;
}

export interface UtilityRuleDefinition<TDeclarations = CSSDeclarations> {
    declarations: TDeclarations
    atRules?: string[]
    selector?: string
}

export interface UtilityDefinition<
    TDeclarerName extends string = string,
    TTransformerName extends string = string,
    TDeclarations = CSSDeclarations
> {
    name: string
    type?: UtilityType
    layer?: UtilityLayerName
    matcher?: RegExp | string
    key?: string
    subkey?: string
    aliasGroups?: string[]
    values?: string[]
    kind?: 'number' | 'color' | 'image'
    namespaces?: string[]
    separators?: string[]
    unit?: any
    declarations?: TDeclarations | string[]
    atRules?: string[]
    rules?: UtilityRuleDefinition<TDeclarations>[]
    includeAnimations?: boolean
    declarer?: TDeclarerName
    declarerOptions?: unknown
    transformer?: TTransformerName
    transformerOptions?: unknown
}

export type UtilityDefinitions<
    TDeclarerName extends string = string,
    TTransformerName extends string = string,
    TDeclarations = CSSDeclarations
> = UtilityDefinition<TDeclarerName, TTransformerName, TDeclarations>[]

export type VariableDefinitions = VariableDefinition[]
export type ModeDefinitions = string[]
export type DefaultModeDefinition = 'light' | 'dark' | 'none' | string

export interface FunctionDefinition<TFunctionTransformerName extends string = string> {
    unit?: string
    transformer?: TFunctionTransformerName
    transformerOptions?: unknown
}

export type FunctionDefinitions<TFunctionTransformerName extends string = string> = Record<string, FunctionDefinition<TFunctionTransformerName>>

export interface Config<
    TDeclarerName extends string = string,
    TTransformerName extends string = string,
    TFunctionTransformerName extends string = string,
    TDeclarations = CSSDeclarations
> {
    atTokens?: AtTokenDefinitions
    selectorTokens?: SelectorTokenDefinitions
    variables?: VariableDefinitions
    utilities?: UtilityDefinitions<TDeclarerName, TTransformerName, TDeclarations>
    rootSize?: number
    baseUnit?: number
    defaultMode?: DefaultModeDefinition
    scope?: string
    important?: boolean
    functions?: FunctionDefinitions<TFunctionTransformerName>
    animations?: AnimationDefinitions<TDeclarations>
    modes?: ModeDefinitions
    modeTrigger?: 'class' | 'media' | 'host'
}

declare module 'csstype' {
    interface PropertiesHyphen {
        '-webkit-user-drag'?: 'auto' | 'element' | 'none' | 'inherit'
        'user-drag'?: 'auto' | 'element' | 'none' | 'inherit'
        '-webkit-text-decoration'?: string
    }
}
