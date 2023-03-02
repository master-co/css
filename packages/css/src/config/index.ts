import breakpoints from './breakpoints'
import colors from './colors'
import rootSize from './root-size'
import scope from './scope'
import selectors from './selectors'
import semantics from './semantics'
import themes from './themes'
import theme from './theme'
import values from './values'
import Rules from './rules'
import Rule from '../rule'
import override from './override'
import observe from './observe'
import important from './important'
import { ThemeConfig } from '../theme'

const config: Config = {
    colors,
    breakpoints,
    semantics,
    values,
    selectors,
    themes,
    theme,
    Rules,
    rootSize,
    scope,
    override,
    observe,
    important
}

export default config

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
