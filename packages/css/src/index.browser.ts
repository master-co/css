import type { Config } from './config'
import { MasterCSS } from './css'

window.MasterCSS = MasterCSS

new MasterCSS(window['masterCSSConfig'])

declare global {
    interface Window {
        MasterCSS: typeof MasterCSS
        masterCSSInstances: MasterCSS[]
        refreshMasterCSS(config: Config): void
        rootMasterCSS: MasterCSS
    }
}
