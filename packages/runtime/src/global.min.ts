import initCSSRuntime from './init'
import themeConfig from '@master/css/index.css?master-css-config'
import { extendConfig } from '@master/css/utils'

const windowConfigs = window.masterCSSConfigs
const windowConfig = window.masterCSSConfig
const configs = []

if (windowConfigs) configs.push(...windowConfigs)
if (windowConfig) configs.push(windowConfig)

if (configs.length) {
    initCSSRuntime({ config: extendConfig(themeConfig, ...configs) })
} else {
    initCSSRuntime({ config: themeConfig })
}
