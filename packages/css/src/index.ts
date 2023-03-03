import type { Rules } from './config'
import type { Rule } from './rule'
import type { ThemeConfig } from './theme'

// core
export { MasterCSS as default } from './css'
export * from './css'
export * from './rule'
export * from './theme'

// methods
export { default as extend } from 'to-extend'
export * from './methods'

// config
export * from './config'
export * as config from './config'

// type
export type { Declaration, MediaQuery, MediaFeatureRule, RuleMatching } from './rule'
export type { ThemeConfig, ThemeValue } from './theme'

type Classes = { [key: string]: string | Classes }
type Colors = { [key: string]: string | Colors }
type Breakpoints = { [key: string]: number | Breakpoints }
type MediaQueries = { [key: string]: string | MediaQueries }
type Selectors = { [key: string]: string | string[] | Selectors }
type SemanticsBase = { [key: string]: string | number | SemanticsBase }
type Semantics = { [key: string]: SemanticsBase }
type Values = { [key: string]: string | number | Values }

export interface Config {
    classes?: Classes
    colors?: Colors
    breakpoints?: Breakpoints
    mediaQueries?: MediaQueries
    selectors?: Selectors
    semantics?: Semantics
    values?: {
        [id in typeof Rules[number]['id']]?: Values
    } & Values
    Rules?: typeof Rule[],
    themes?: Record<string, { classes?: Classes, colors?: Colors }> | string[],
    rootSize?: number
    scope?: string
    important?: boolean
    theme?: ThemeConfig,
    override?: boolean
    observe?: boolean
}
