import type { Config } from './config'
import { MasterCSS } from './core'

window.masterCSS = new MasterCSS(window.masterCSSConfig).observe(document)

declare global {
    interface Window {
        masterCSSConfig: Config
    }
}
