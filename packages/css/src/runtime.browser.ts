import type { Config } from './config'
import initRuntime from './functions/init-runtime'

(() => {
    initRuntime(window.masterCSSConfig)
})()

declare global {
    interface Window {
        masterCSSConfig: Config
    }
}
