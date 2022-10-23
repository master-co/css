import defaultBreakpoints from './breakpoints'
import defaultColors from './colors'
import defaultRootSize from './root-size'
import defaultSelectors from './selectors'
import defaultSemantics from './semantics'
import defaultThemes from './themes'
import defaultScheme from './scheme'
import defaultValues from './values'
import DefaultRules from './rules'

const defaultConfig: MasterCSSConfig = {
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

export {
    defaultConfig,
    defaultBreakpoints,
    defaultColors,
    defaultRootSize,
    defaultSelectors,
    defaultSemantics,
    defaultThemes,
    defaultScheme,
    defaultValues,
    DefaultRules
}

import type MasterCSS from '../css'
import type { MasterCSSRule } from '../rule'

export interface MasterCSSConfig {
    classes?: Record<string, string>
    colors?: Record<string, string | Record<string, string>>
    breakpoints?: Record<string, number>
    mediaQueries?: Record<string, string>
    selectors?: Record<string, string | string[]>
    semantics?: Record<string, string | Record<string, string | number>>
    values?: Record<string, Record<string, string | number>>
    Rules?: typeof MasterCSSRule[],
    themes?: Record<string, { classes?: Record<string, string>, colors?: Record<string, string | Record<string, string>> }> | string[],
    rootSize?: number
    validateRule?: (rule: MasterCSSRule, css?: MasterCSS) => boolean
    scheme?: {
        preference: string,
        storage: {
            sync: boolean
            key: string
        }
    }
}