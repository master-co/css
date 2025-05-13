import { SyntaxRuleDefinition } from './config'

export type ValueComponent = StringValueComponent | NumberValueComponent | FunctionValueComponent | VariableValueComponent | SeparatorValueComponent
export interface StringValueComponent { text?: string, token: string, type: 'string', value: string }
export interface NumberValueComponent { text?: string, token: string, type: 'number', value: number, unit?: string }
export interface FunctionValueComponent { text?: string, token: string, type: 'function', name: string, symbol: string, children: ValueComponent[], bypassTransform?: boolean }
export interface VariableValueComponent { text?: string, token: string, type: 'variable', name: string, alpha?: number, fallback?: string, variable?: Variable }
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
    variables?: Map<string, Variable>
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
    namespace?: string,
    group?: string,
    name: string,
    key: string,
    modes?: Record<string, LiteralVariable>
}
export type StringVariable = { type: 'string', value: string }
export type NumberVariable = { type: 'number', value: number }
export type ColorVariable = { type: 'color', value: string, space: 'rgb' | 'hsl', alpha?: number }
export type LiteralVariable = StringVariable | NumberVariable | ColorVariable
export type Variable = LiteralVariable & VariableCommon