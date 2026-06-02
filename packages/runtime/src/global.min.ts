import initCSSRuntime from './init'
import { extendConfig } from '@master/css/utils'

const windowConfigs = window.masterCSSConfigs
const windowConfig = window.masterCSSConfig
const configs = []

if (windowConfigs) configs.push(...windowConfigs)
if (windowConfig) configs.push(windowConfig)

if (configs.length) {
    initCSSRuntime(extendConfig(...configs))
} else {
    initCSSRuntime()
}
