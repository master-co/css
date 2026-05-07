import initCSSRuntime from './init'
import { extendConfig } from '@master/css'

const customConfigs = window.masterCSSConfigs
const customConfig = window.masterCSSConfig
const configs = []

if (customConfigs) configs.push(...customConfigs)
if (customConfig) configs.push(customConfig)

if (configs.length) {
    initCSSRuntime(extendConfig(...configs))
} else {
    initCSSRuntime()
}
