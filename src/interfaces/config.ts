import { MasterCSSRule } from 'src/rule'

export interface MasterCSSConfig {
    classes?: any
    colors?: any
    Rules?: typeof MasterCSSRule[]
}