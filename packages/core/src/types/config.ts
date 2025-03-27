import type { PropertiesHyphen } from 'csstype'
import type SyntaxRuleType from '../syntax-rule-type'
import type { SyntaxRule } from '../syntax-rule'
import type { ValueComponent } from './syntax'
import type { rules, utilities } from '../config'

export interface SyntaxRuleDefinition {
    type?: SyntaxRuleType
    matcher?: RegExp
    sign?: string
    key?: string
    subkey?: string
    ambiguousKeys?: string[]
    ambiguousValues?: (RegExp | string)[]
    variables?: string[]
    separators?: string[]
    unit?: any
    declarations?: PropertiesHyphen
    includeAnimations?: boolean
    analyze?: (this: SyntaxRule, className: string) => [valueToken: string, prefixToken?: string]
    transformValue?(this: SyntaxRule, value: string): string
    transformValueComponents?(this: SyntaxRule, valueComponents: ValueComponent[]): ValueComponent[]
    declare?(this: SyntaxRule, value: string, valueComponents: ValueComponent[]): PropertiesHyphen
    delete?(this: SyntaxRule, className: string): void
    create?(this: SyntaxRule, className: string): void
    insert?(this: SyntaxRule): void
}

export type VariableValue = number | string | false | (number | string)[]
export type VariableDefinition = { [key in '' | `@${string}` | string]?: VariableValue | VariableDefinition } | VariableValue
export type CSSKeyframes = Record<'from' | 'to' | string, PropertiesHyphen>
export type AnimationDefinitions = Record<string, CSSKeyframes>;
export type SelectorDefinitions = Record<string, string | string[]>;
export type AtType = 'media' | 'layer' | 'supports' | 'container'
export interface AtDefinition {
    type?: AtType
    name?: string
    value: number | string
}
export type AtDefinitions = Record<string, AtDefinition>
export interface StyleDefinitions { [key: string]: string | StyleDefinitions }
export type SyntaxRuleDefinitions = Partial<Record<keyof typeof rules | string, SyntaxRuleDefinition>>
export type VariableDefinitions = { [key in keyof typeof rules]?: VariableDefinition } & Record<string, VariableDefinition>
export type UtilityDefinitions = { [key in keyof typeof utilities]?: PropertiesHyphen } & Record<string, PropertiesHyphen>
export type ModeDefinitions = Record<string, 'class' | 'media' | 'host' | false>;
export interface FunctionDefinition {
    unit?: string
    transform?(this: SyntaxRule, value: string, bypassVariableNames: string[]): string | ValueComponent[]
}
export type FunctionDefinitions = Record<string, FunctionDefinition>;

export interface Config {
    extends?: (Config | any)[]
    components?: StyleDefinitions
    at?: AtDefinitions
    selectors?: SelectorDefinitions
    utilities?: UtilityDefinitions
    variables?: VariableDefinitions
    rules?: SyntaxRuleDefinitions
    rootSize?: number
    baseUnit?: number
    defaultMode?: 'light' | 'dark' | string | false
    scope?: string
    important?: boolean
    override?: boolean
    functions?: FunctionDefinitions
    animations?: AnimationDefinitions
    modes?: ModeDefinitions
}