import { MasterCSSRule } from 'src/rule'

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
}