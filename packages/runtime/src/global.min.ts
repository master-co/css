import initCSSRuntime from './init'

const customConfigs = window.masterCSSConfigs
const customConfig = window.masterCSSConfig

if (customConfig) {
    const configs = []
    if (customConfigs) configs.push(...customConfigs)
    if (customConfig.extends) configs.push(...customConfig.extends)
    initCSSRuntime({ ...customConfig, extends: configs })
} else if (customConfigs) {
    initCSSRuntime({ extends: customConfigs })
} else {
    initCSSRuntime()
}