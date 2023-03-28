import { breakpoints } from './breakpoints'
import { colors } from './colors'
import { rootSize } from './root-size'
import { scope } from './scope'
import { selectors } from './selectors'
import { semantics } from './semantics'
import { themes } from './themes'
import { rules } from './rules'
import { override } from './override'
import { observe } from './observe'
import { important } from './important'
import { keyframes } from './keyframes'
import { functions, FunctionConfig } from './functions'

const config: Config = {
    breakpoints,
    colors,
    rootSize,
    scope,
    selectors,
    semantics,
    themes,
    rules,
    override,
    observe,
    important,
    functions,
    keyframes
}

export {
    config,
    breakpoints,
    colors,
    rootSize,
    scope,
    selectors,
    semantics,
    themes,
    rules,
    override,
    observe,
    important,
    functions,
    keyframes
}

import type { RuleConfig } from '../rule'

type Classes = { [key: string]: string | Classes }
type Colors = { [key: string]: string | Colors }
type Breakpoints = { [key: string]: number | Breakpoints }
type MediaQueries = { [key: string]: string | MediaQueries }
type Selectors = { [key: string]: string | string[] | Selectors }
type SemanticsBase = { [key: string]: string | number | SemanticsBase }
type Semantics = { [key: string]: SemanticsBase }
export type Values = { [key: string]: string | number | Values }

export interface Config {
    classes?: Classes
    colors?: Colors
    breakpoints?: Breakpoints
    mediaQueries?: MediaQueries
    selectors?: Selectors
    semantics?: Semantics
    values?: Values
    rules?: Record<string, RuleConfig>
    themes?: Record<string, { classes?: Classes, colors?: Colors }> | string[]
    rootSize?: number
    scope?: string
    important?: boolean
    override?: boolean
    observe?: boolean
    functions?: Record<string, FunctionConfig>
    keyframes?: Record<string, Record<string, Record<string, string | number>>>
}