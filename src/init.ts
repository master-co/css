import MasterCSS from './core'
import { MasterCSSConfig } from './interfaces/config'

export function init(config?: MasterCSSConfig) {
    if (typeof window !== 'undefined') {
        const css = new MasterCSS(config, document.head)
        MasterCSS.root = css
        css.observe(document.documentElement)
        return css
    } else {
        return new MasterCSS(config)
    }
}