import mediaQueries from './media-queries'
import selectors from './selectors'
import semantics from './semantics'
import animations from './animations'
import variables from './variables'
import rules from './rules'
import functions from './functions'
import { CSSDeclarations } from '../types/css-declarations'
import type { Rule, RuleDefinition, ValueComponent } from '../rule'

const config: Config = {
    mediaQueries,
    selectors,
    // @ts-expect-error
    semantics,
    rules,
    functions,
    // @ts-expect-error
    animations,
    variables,
    scope: '',
    rootSize: 16,
    override: false,
    important: false,
    themeDriver: 'class'
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
export type VariableDefinition = { [key in '' | `@${string}`]?: VariableValue } & { [key: string]: VariableValue | VariableDefinition }
export type AnimationDefinition = { [key in 'from' | 'to']?: CSSDeclarations } & { [key: string]: CSSDeclarations }
export type AnimationDefinitions = { [key: string]: AnimationDefinition }
export type SelectorDefinitions = { [key: string]: string | string[] | SelectorDefinitions }
export type MediaQueryDefinitions = { [key: string]: number | string | MediaQueryDefinitions }
export type StyleDefinitions = { [key: string]: string | StyleDefinitions }
export type RuleDefinitions = { [key in keyof typeof rules | string]?: RuleDefinition }
export type VariableDefinitions = { [key in keyof typeof rules]?: VariableDefinition } & { [key: string]: VariableDefinition | VariableValue }
export type SemanticDefinitions = { [key in keyof typeof semantics]?: CSSDeclarations } & { [key: string]: CSSDeclarations }
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
    scope?: string
    important?: boolean
    override?: boolean
    functions?: FunctionDefinitions,
    animations?: AnimationDefinitions
    themeDriver?: 'class' | 'media' | 'host'
}
