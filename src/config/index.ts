
import defaultBreakpoints from './breakpoints'
import defaultColors from './colors'
import defaultRootSize from './root-size'
import defaultSelectors from './selectors'
import defaultSemantics from './semantics'
import defaultThemes from './themes'
import defaultScheme from './scheme'
import defaultValues from './values'
import DefaultRules from './rules'
import Rule from '../rule'
import MasterCSS from '../css'

const defaultConfig: Config = {
    colors: defaultColors,
    breakpoints: defaultBreakpoints,
    semantics: defaultSemantics,
    values: defaultValues,
    selectors: defaultSelectors,
    themes: defaultThemes,
    scheme: defaultScheme,
    Rules: DefaultRules,
    rootSize: defaultRootSize
}

export default defaultConfig

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
        [id in typeof DefaultRules[number]['id']]?: Values
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