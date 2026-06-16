import type { MasterCSSPlanUtility, MasterCSSPlanUtilityLayerName, MasterCSSPlanVariableNumericValue } from './master-css-plan.js'

export type ValueComponent = StringValueComponent | NumberValueComponent | FunctionValueComponent | VariableValueComponent | SeparatorValueComponent

export interface StringValueComponent { text?: string, token: string, type: 'string', value: string }
export interface NumberValueComponent { text?: string, token: string, type: 'number', value: number, unit?: string }
export interface FunctionValueComponent { text?: string, token: string, type: 'function', name: string, symbol: string, children: ValueComponent[], bypassTransform?: boolean }
export interface VariableValueComponent { text?: string, token: string, type: 'variable', name: string, alpha?: number, fallback?: string, negative?: boolean, variable?: Variable }
export interface SeparatorValueComponent { text?: string, token: string, type: 'separator', value: string }

export interface DefinedUtility {
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
    definition: MasterCSSPlanUtility
}

export type ExplicitUtilityLayerName = MasterCSSPlanUtilityLayerName

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
    name: string,
    key: string,
    inline?: boolean,
    static?: boolean,
    modes?: Record<string, ResolvedVariableValue>
    dependencies?: Set<string>
}

export type StringVariable = { type: 'string', value: string | number }
export type NumberVariable = { type: 'number', value: number | string, numeric?: MasterCSSPlanVariableNumericValue }
export type ResolvedVariableValue = StringVariable | NumberVariable

export type Variable = VariableCommon & {
    type: ResolvedVariableValue['type']
    value?: ResolvedVariableValue['value']
    numeric?: MasterCSSPlanVariableNumericValue
}
