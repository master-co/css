import type { Config } from './config'
import { MasterCSS, allCSS, refresh } from './css'

Object.assign(window, {
    MasterCSS,
    masterCSSInstances: allCSS,
    refreshMasterCSS: refresh,
    rootMasterCSS: new MasterCSS(window['masterCSSConfig'])
})

declare global {
    interface Window {
        MasterCSS: typeof MasterCSS
        masterCSSInstances: MasterCSS[]
        refreshMasterCSS(config: Config): void
        rootMasterCSS: MasterCSS
    }
}
