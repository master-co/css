
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

export interface Config {
    classes?: Record<string, string>
    colors?: Record<string, string | Record<string, string>>
    breakpoints?: Record<string, number>
    mediaQueries?: Record<string, string>
    selectors?: Record<string, string | string[]>
    semantics?: Record<string, string | Record<string, string | number>>
    values?: { 
        [id in typeof DefaultRules[number]['id']]?: Record<string, string | number>
    } & {
        [key: string]: Record<string, string | number> | string | number
    },
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