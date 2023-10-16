import mediaQueries from './media-queries'
import colors from './colors'
import selectors from './selectors'
import semantics from './semantics'
import animations from './animations'
import variables from './variables'
import rules from './rules'
import functions from './functions'
import { CSSDeclarations } from '../types/css-declarations'
import type { Rule } from '../rule'
import { CoreLayer, Layer } from '../layer'

const config: Config = {
    mediaQueries,
    colors,
    selectors,
    semantics,
    rules,
    functions,
    animations,
    variables: variables as any,
    scope: '',
    rootSize: 16,
    override: false,
    important: false,
    themeDriver: 'class'
}

export {
    config,
    mediaQueries,
    colors,
    selectors,
    semantics,
    rules,
    functions,
    animations,
    variables
}

export interface RuleOptions {
    id?: string
    match?: RegExp | [string, string[]?]
    resolvedMatch?: RegExp
    resolvedVariables?: any
    variables?: Record<string, string | number> | Array<string | number | Record<string, string | number>>
    order?: number
    separators?: string[]
    shorthand?: string
    colored?: boolean
    numeric?: boolean
    unit?: any
    native?: boolean
    declarations?: CSSDeclarations
    resolvedPropName?: string
    layer?: Layer | CoreLayer,
    analyze?(this: Rule, className: string): [valueToken: string, prefixToken?: string]
    transform?(this: Rule, value: string): string
    declare?(this: Rule, value: string, unit: string): CSSDeclarations
    delete?(this: Rule, className: string): void
    create?(this: Rule, className: string): void
    insert?(this: Rule): void
}

type VariableValue = number | string | VariableGroup | (number | string)[]
type VariableGroup = { [key: string]: VariableValue }
type Variables =
    { [key in keyof typeof rules]: VariableGroup } |
    { [key in string]: VariableGroup | VariableValue }

export interface Config {
    extends?: (Config | { config: Config })[]
    styles?: { [key: string]: string | Config['styles'] }
    colors?: { [key: string]: string | Config['colors'] }
    mediaQueries?: { [key: string]: number | Config['mediaQueries'] }
    selectors?: { [key: string]: string | string[] | Config['selectors'] }
    semantics?: { [key in keyof typeof semantics]?: CSSDeclarations } & { [key: string]: CSSDeclarations }
    variables?: Variables
    rules?: { [key in keyof typeof rules | string]?: RuleOptions }
    rootSize?: number
    scope?: string
    important?: boolean
    override?: boolean
    functions?: Record<string, {
        unit?: string
        colored?: boolean
        transform?(this: Rule, opening: string, value: string, closing: string): string
    }>,
    animations?: Record<string, { [key in 'from' | 'to']?: CSSDeclarations } & { [key: string]: CSSDeclarations }>
    themeDriver?: 'class' | 'media' | 'host'
}