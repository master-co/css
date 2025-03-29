import { AtIdentifier, SyntaxRuleDefinition } from './config'
import { AT_COMPARISON_OPERATORS } from '../common'

export declare type AtNumberComponent = { name: string, operator?: (typeof AT_COMPARISON_OPERATORS)[number] } & NumberValueComponent
export declare type AtStringComponent = { name: string } & StringValueComponent
export declare type AtValueComponent = AtNumberComponent | AtStringComponent
export interface AtComparisonOperatorComponent { type: 'comparison', token: string, value: string }
export interface AtLogicalOperatorComponent { type: 'logical', token: string, value: string }
export type AtOperatorComponent = AtComparisonOperatorComponent | AtLogicalOperatorComponent
export interface AtGroupComponent { type: 'group', token?: string, children: AtComponent[], value?: string }
export type AtComponent = AtValueComponent | AtComparisonOperatorComponent | AtLogicalOperatorComponent | AtGroupComponent

export type ValueComponent = StringValueComponent | NumberValueComponent | FunctionValueComponent | VariableValueComponent | SeparatorValueComponent
export interface StringValueComponent { text?: string, token: string, type: 'string', value: string }
export interface NumberValueComponent { text?: string, token: string, type: 'number', value: number, unit?: string }
export interface FunctionValueComponent { text?: string, token: string, type: 'function', name: string, symbol: string, children: ValueComponent[], bypassTransform?: boolean }
export interface VariableValueComponent { text?: string, token: string, type: 'variable', name: string, alpha?: string, fallback?: string, variable?: Variable }
export interface SeparatorValueComponent { text?: string, token: string, type: 'separator', value: string }
export interface DefinedRule {
    id: string
    key?: string
    keys: string[]
    matchers: {
        key?: RegExp
        variable?: RegExp
        value?: RegExp
        arbitrary?: RegExp
    }
    variables: Record<string, Variable>
    order: number
    definition: SyntaxRuleDefinition
}

export type MediaFeatureComponent = {
    type: string
    tokenType?: string
    operator?: string
    value: number
    unit: string
}

export interface MediaQuery {
    token: string;
    features: Record<string, MediaFeatureComponent>
    type?: string;
}

type VariableCommon = {
    group?: string,
    name: string,
    key: string,
    modes?: Record<string, TypeVariable>
}
export interface StringVariable { type: 'string', value: string }
export interface NumberVariable { type: 'number', value: number }
export interface ColorVariable { type: 'color', value: string, space: 'rgb' | 'hsl' }
export type TypeVariable = StringVariable | NumberVariable | ColorVariable
export type Variable = TypeVariable & VariableCommon
export type AtRule = {
    id: AtIdentifier
    components: AtComponent[]
}