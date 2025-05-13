import type { PropertiesHyphen } from 'csstype'
import type { rules, utilities } from '../config'
import { AT_IDENTIFIERS } from '../common'
import { SyntaxRuleTypeValue } from './common'
import { DeclarerNames } from '../declarers'
import { TransformerNames } from '../transformers'
import { FunctionTransformerNames } from '../function-transformers'

export interface SyntaxRuleDefinition {
    type?: SyntaxRuleTypeValue
    matcher?: RegExp | string
    sign?: string
    key?: string
    subkey?: string
    aliasGroups?: string[]
    values?: string[]
    kind?: 'number' | 'color' | 'image'
    variables?: string[]
    separators?: string[]
    unit?: any
    declarations?: PropertiesHyphen | Record<string, string | undefined | (string | undefined)[]> | (keyof PropertiesHyphen)[]
    includeAnimations?: boolean
    declarer?: DeclarerNames | [DeclarerNames, any],
    transformer?: TransformerNames | [TransformerNames, any],
}

export type VariableValue = number | string | false | (number | string)[]
export type VariableDefinition = { [key in '' | string]?: VariableValue | VariableDefinition } | VariableValue
export type CSSKeyframes = Record<'from' | 'to' | string, PropertiesHyphen>
export type AnimationDefinitions = Record<string, CSSKeyframes>;
export type SelectorDefinitions = Record<string, string>;
export type AtIdentifier = typeof AT_IDENTIFIERS[number]
export type AtDefinition = number | string
export interface AtDefinitions {
    [key: string]: AtDefinition | AtDefinitions;
}
export interface ComponentDefinitions { [key: string]: string | ComponentDefinitions }
export type ScreenDefinitions = Record<string, number>
export type SyntaxRuleDefinitions = Partial<Record<keyof typeof rules | string, SyntaxRuleDefinition>>
export type VariableDefinitions = { [key in keyof typeof rules]?: VariableDefinition } & Record<string, VariableDefinition>
export type UtilityDefinitions = { [key in keyof typeof utilities]?: PropertiesHyphen } & Record<string, PropertiesHyphen>
export type ModeDefinitions = Record<string, VariableDefinitions>;
export interface FunctionDefinition {
    unit?: string
    transformer?: FunctionTransformerNames | [FunctionTransformerNames, any]
}
export type FunctionDefinitions = Record<string, FunctionDefinition>;

export interface Config {
    extends?: (Config | any)[]
    components?: ComponentDefinitions
    at?: AtDefinitions
    selectors?: SelectorDefinitions
    utilities?: UtilityDefinitions
    variables?: VariableDefinitions
    rules?: SyntaxRuleDefinitions
    screens?: ScreenDefinitions
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