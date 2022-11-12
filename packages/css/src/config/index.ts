
import breakpoints from './breakpoints'
import colors from './colors'
import rootSize from './root-size'
import selectors from './selectors'
import semantics from './semantics'
import themes from './themes'
import scheme from './scheme'
import values from './values'
import Rules from './rules'
import Rule from '../rule'
import MasterCSS from '../css'

const config: Config = {
    colors: colors,
    breakpoints: breakpoints,
    semantics: semantics,
    values: values,
    selectors: selectors,
    themes: themes,
    scheme: scheme,
    Rules: Rules,
    rootSize: rootSize
}

export default config

type Colors = { [key: string]: string | Colors }
type Breakpoints = { [key: string]: number | Breakpoints }
type Selectors = { [key: string]: string | string[] | Selectors }
type Semantics = { [key: string]: string | Record<string, string | number | Semantics> }
type Values = { [key: string]: string | number | Values }

export interface Config {
    classes?: Record<string, string>
    colors?: Colors
    breakpoints?: Breakpoints
    mediaQueries?: Record<string, string>
    selectors?: Selectors
    semantics?: Semantics
    values?: {
        [id in typeof Rules[number]['id']]?: Values
    } & Values
    Rules?: typeof Rule[],
    themes?: Record<string, { classes?: Record<string, string>, colors?: Record<string, string | Record<string, string>> }> | string[],
    rootSize?: number
    validateRule?: (rule: Rule, css?: MasterCSS) => boolean
    scheme?: {
        preference?: string,
        storage?: {
            sync?: boolean
            key?: string
        }
    }
}