import { MasterCSSRule } from 'src/rule'

export interface MasterCSSConfig {
    classes?: any
    colors?: any
    breakpoints?: any
    semantics?: any
    values?: any
    Rules?: typeof MasterCSSRule[]
}