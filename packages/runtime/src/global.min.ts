import initCSSRuntime from './init'

const windowConfigs = window.masterCSSConfigs
const windowConfig = window.masterCSSConfig
const configs = []

if (windowConfigs) configs.push(...windowConfigs)
if (windowConfig) configs.push(windowConfig)

if (configs.length) {
    initCSSRuntime(configs)
} else {
    initCSSRuntime()
}
