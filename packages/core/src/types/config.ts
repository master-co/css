import type { PropertiesHyphen } from 'csstype'
import { AT_IDENTIFIERS } from '../common'
import { DeclarerNames } from '../declarers'
import { TransformerNames } from '../transformers'
import { FunctionTransformerNames } from '../function-transformers'
import UtilityType from '../utility-type'

export type CSSDeclarations = PropertiesHyphen | Record<string, string | number | undefined | (string | number | undefined)[]>

export interface UtilityDefinition {
    name: string
    type?: UtilityType
    matcher?: RegExp | string
    sign?: string
    key?: string
    subkey?: string
    aliasGroups?: string[]
    values?: string[]
    kind?: 'number' | 'color' | 'image'
    namespaces?: string[]
    separators?: string[]
    unit?: any
    declarations?: CSSDeclarations | (keyof PropertiesHyphen)[]
    atRules?: string[]
    rules?: UtilityRuleDefinition[]
    includeAnimations?: boolean
    declarer?: DeclarerNames
    declarerOptions?: unknown
    transformer?: TransformerNames
    transformerOptions?: unknown
}

export interface UtilityRuleDefinition {
    declarations: CSSDeclarations
    atRules?: string[]
}

export type VariableValue = number | string | false | (number | string)[]
export interface VariableDefinition {
    key: string
    namespace?: string
    value: VariableValue
    mode?: string
}
export type CSSKeyframes = Record<'from' | 'to' | string, PropertiesHyphen>
export type AnimationDefinitions = Record<string, CSSKeyframes>;
export type SelectorTokenDefinitions = Record<string, string>;
export type AtIdentifier = typeof AT_IDENTIFIERS[number]
export type AtTokenDefinition = number | string
export type ComponentLayerName = 'base' | 'preset' | 'components' | 'utilities'
export interface AtTokenDefinitions {
    [key: string]: AtTokenDefinition | AtTokenDefinitions;
}
export interface ComponentDefinition {
    selector: string
    declarations: CSSDeclarations
    atRules?: string[]
    layer?: ComponentLayerName
}
export type ComponentDefinitions = Record<string, ComponentDefinition[]>
export type UtilityDefinitions = UtilityDefinition[]
export type VariableDefinitions = VariableDefinition[]
export type ModeDefinitions = string[];
export interface FunctionDefinition {
    unit?: string
    transformer?: FunctionTransformerNames
    transformerOptions?: unknown
}
export type FunctionDefinitions = Record<string, FunctionDefinition>;

export interface Config {
    extends?: (Config | any)[]
    components?: ComponentDefinitions
    atTokens?: AtTokenDefinitions
    selectorTokens?: SelectorTokenDefinitions
    variables?: VariableDefinitions
    utilities?: UtilityDefinitions
    rootSize?: number
    baseUnit?: number
    defaultMode?: 'light' | 'dark' | string | false
    scope?: string
    important?: boolean
    functions?: FunctionDefinitions
    animations?: AnimationDefinitions
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
