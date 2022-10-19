import MasterCSS from '../css'
import { MasterCSSConfig } from '../interfaces/config'

export function init(config?: MasterCSSConfig) {
    if (typeof window !== 'undefined') {
        const css = new MasterCSS(config, document)
        MasterCSS.root = css
        css.observe()
        return css
    } else {
        return new MasterCSS(config)
    }
}