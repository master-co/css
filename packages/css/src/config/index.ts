import mediaQueries from './media-queries'
import selectors from './selectors'
import semantics from './semantics'
import animations from './animations'
import variables from './variables'
import rules from './rules'
import functions from './functions'
import type { PropertiesHyphen } from 'csstype'
import type { Rule, RuleDefinition, ValueComponent } from '../rule'

const config: Config = {
    mediaQueries,
    selectors,
    semantics,
    rules,
    functions,
    animations,
    variables,
    scope: '',
    rootSize: 16,
    baseUnit: 4,
    override: false,
    important: false,
    themeDriver: 'class',
}

export {
    config,
    mediaQueries,
    selectors,
    semantics,
    rules,
    functions,
    animations,
    variables
}

export type VariableValue = number | string | Array<number | string>
export type VariableDefinition = { [key in '' | `@${string}` | string]?: VariableValue | VariableDefinition }
export type CSSKeyframes = { [key in 'from' | 'to' | string]: PropertiesHyphen }
export type AnimationDefinitions = { [key: string]: CSSKeyframes }
export type SelectorDefinitions = { [key: string]: string | string[] | SelectorDefinitions }
export type MediaQueryDefinitions = { [key: string]: number | string | MediaQueryDefinitions }
export type StyleDefinitions = { [key: string]: string | StyleDefinitions }
export type RuleDefinitions = { [key in keyof typeof rules | string]?: RuleDefinition }
export type VariableDefinitions = { [key in keyof typeof rules]?: VariableDefinition | VariableValue } & { [key: string]: VariableDefinition | VariableValue }
export type SemanticDefinitions = { [key in keyof typeof semantics]?: PropertiesHyphen } & { [key: string]: PropertiesHyphen }
export interface FunctionDefinition {
    unit?: string
    colored?: boolean
    transform?(this: Rule, value: string, bypassVariableNames: string[]): string | ValueComponent[]
}
export type FunctionDefinitions = { [key: string]: FunctionDefinition }

export interface Config {
    extends?: (Config | any)[]
    styles?: StyleDefinitions
    mediaQueries?: MediaQueryDefinitions
    selectors?: SelectorDefinitions
    semantics?: SemanticDefinitions
    variables?: VariableDefinitions
    rules?: RuleDefinitions
    rootSize?: number
    baseUnit?: number
    scope?: string
    important?: boolean
    override?: boolean
    functions?: FunctionDefinitions
    animations?: AnimationDefinitions
    themeDriver?: 'class' | 'media' | 'host'
}