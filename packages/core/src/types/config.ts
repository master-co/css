import type { PropertiesHyphen } from 'csstype'
import type { SyntaxRule } from '../syntax-rule'
import type { ValueComponent } from './syntax'
import type { rules, utilities } from '../config'
import { AT_IDENTIFIERS } from '../common'
import { SyntaxRuleTypeValue } from './common'
import { DeclarerNames } from '../declarers'

export interface SyntaxRuleDefinition {
    type?: SyntaxRuleTypeValue
    matcher?: RegExp
    sign?: string
    key?: string
    subkey?: string
    aliasGroups?: string[]
    values?: (RegExp | string)[]
    variables?: string[]
    separators?: string[]
    unit?: any
    declarations?: PropertiesHyphen | Record<string, string | undefined | (string | undefined)[]>
    includeAnimations?: boolean
    declarer?: {
        name: DeclarerNames
        data?: any
    },
    analyze?: (this: SyntaxRule, className: string) => [valueToken: string, prefixToken?: string]
    transformValue?(this: SyntaxRule, value: string): string
    transformValueComponents?(this: SyntaxRule, valueComponents: ValueComponent[]): ValueComponent[]
    delete?(this: SyntaxRule, className: string): void
    create?(this: SyntaxRule, className: string): void
    insert?(this: SyntaxRule): void
}

export type VariableValue = number | string | false | (number | string)[]
export type VariableDefinition = { [key in '' | `@${string}` | string]?: VariableValue | VariableDefinition } | VariableValue
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
    transform?(this: SyntaxRule, value: string, bypassVariableNames: string[]): string | ValueComponent[]
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
    override?: boolean
    functions?: FunctionDefinitions
    animations?: AnimationDefinitions
    modes?: ModeDefinitions
    modeTrigger?: 'class' | 'media' | 'host'
}