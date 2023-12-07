import type { Config } from './config'
import initRuntime from './functions/init-runtime'

(() => {
    initRuntime(window.masterCSSConfig)
})()

declare global {
    // eslint-disable-next-line no-var
    var masterCSSConfig: Config
}
