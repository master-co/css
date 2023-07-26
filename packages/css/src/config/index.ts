import { breakpoints } from './breakpoints'
import { colors } from './colors'
import { rootSize } from './root-size'
import { scope } from './scope'
import { selectors } from './selectors'
import { semantics } from './semantics'
import { rules } from './rules'
import { override } from './override'
import { important } from './important'
import { keyframes } from './keyframes'
import { functions, FunctionConfig } from './functions'
import { themeDriver } from './themeDriver'
import type { Properties } from 'csstype'

const config: Config = {
    breakpoints,
    colors,
    rootSize,
    scope,
    selectors,
    semantics,
    rules,
    override,
    important,
    functions,
    keyframes,
    themeDriver
}

export {
    config,
    breakpoints,
    colors,
    rootSize,
    scope,
    selectors,
    semantics,
    rules,
    override,
    important,
    functions,
    keyframes,
    themeDriver
}

import type { RuleConfig } from '../rule'

type CSS = { [key in keyof Properties]?: Properties[key] } 
type Classes = { [key: string]: string | Classes }
export type Colors = { [key: string]: string | Colors }
type Breakpoints = { [key: string]: number | Breakpoints }
type MediaQueries = { [key: string]: string | MediaQueries }
type Selectors = { [key: string]: string | string[] | Selectors }
type SemanticsBase = CSS | { [key: string]: SemanticsBase }
export type Semantics = { [key: string]: SemanticsBase }
export type Values = { [key: string]: string | number | Values }
export type Keyframes = Record<string, { [key in 'from' | 'to']?: CSS } & { [key: string]: CSS }>

export interface Config {
    extends?: (Config | { config: Config })[]
    classes?: Classes
    colors?: Colors
    breakpoints?: Breakpoints
    mediaQueries?: MediaQueries
    selectors?: Selectors
    semantics?: Semantics
    values?: Values
    rules?: Record<string, RuleConfig>
    rootSize?: number
    scope?: string
    important?: boolean
    override?: boolean
    functions?: Record<string, FunctionConfig>
    keyframes?: Keyframes
    themeDriver?: 'class' | 'media' | 'host'
}