import initCSSRuntime from './init'
import themeConfig from '@master/css/theme.css?master-css-config'
import { extendConfig } from '@master/css/utils'

const windowConfigs = window.masterCSSConfigs
const windowConfig = window.masterCSSConfig
const configs = []

if (windowConfigs) configs.push(...windowConfigs)
if (windowConfig) configs.push(windowConfig)

if (configs.length) {
    initCSSRuntime(extendConfig(themeConfig, ...configs))
} else {
    initCSSRuntime(themeConfig)
}
