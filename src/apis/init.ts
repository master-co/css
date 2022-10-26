import MasterCSS from '../css'
import type { MasterCSSConfig } from '../config'

export default function init(config?: MasterCSSConfig) {
    if (typeof window !== 'undefined') {
        const css = new MasterCSS(config, document)
        MasterCSS.root = css
        css.observe()
        return css
    } else {
        return new MasterCSS(config)
    }
}