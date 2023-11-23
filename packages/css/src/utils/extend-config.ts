import extend from '@techor/extend'
import type { Config } from '../config'

export function extendConfig(...configs: Config[]) {
    const formatConfig = (config: Config) => {
        const clonedConfig: Config = extend({}, config)
        const formatDeeply = (obj: Record<string, any>) => {
            for (const key in obj) {
                const value = obj[key]
                if (typeof value === 'object' && !Array.isArray(value)) {
                    formatDeeply(value)
                } else if (key && !key.startsWith('@')) {
                    obj[key] = { '': value }
                }
            }
        }
        if (clonedConfig.styles) {
            formatDeeply(clonedConfig.styles)
        } else {
            clonedConfig.styles = {}
        }
        if (clonedConfig.mediaQueries) {
            formatDeeply(clonedConfig.mediaQueries)
        } else {
            clonedConfig.mediaQueries = {}
        }
        if (clonedConfig.variables) {
            formatDeeply(clonedConfig.variables)
        } else {
            clonedConfig.variables = {}
        }

        return clonedConfig
    }

    const formattedConfigs: Config[] = []
    for (const eachConfig of configs) {
        (function getConfigsDeeply(config: Config) {
            if (config.extends?.length) {
                for (const eachExtend of config.extends) {
                    getConfigsDeeply('config' in eachExtend ? eachExtend.config : eachExtend)
                }
            }
            formattedConfigs.push(formatConfig(config))
        })(eachConfig)
    }

    let extendedConfig = formattedConfigs[0]
    for (let i = 1; i < formattedConfigs.length; i++) {
        const currentFormattedConfig = formattedConfigs[i]
        extendedConfig = extend(extendedConfig, currentFormattedConfig)
        if (Object.prototype.hasOwnProperty.call(currentFormattedConfig, 'animations')) {
            Object.assign(extendedConfig.animations, currentFormattedConfig.animations)
        }
    }

    return extendedConfig
}