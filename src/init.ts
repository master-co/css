import { defaultConfig } from './configure'
import { MasterCSS } from './css'
import { MasterCSSConfig } from './interfaces/config'

export function init(config?: MasterCSSConfig) {
    if (typeof window !== 'undefined') {
        const css = new MasterCSS(config || defaultConfig, document.head)
        MasterCSS.root = css
        css.observe(document.documentElement)
        return css
    }
}

// MasterCSSRule
//     .extend('colors', colors)
//     .extend('breakpoints', breakpoints)
// MasterCSS.Rules.push(...Rules)

// const MASTER_CSS = 'MasterCSS'