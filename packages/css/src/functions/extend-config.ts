import extend from '@techor/extend'
import type { AnimationDefinitions, Config } from '../config'

export default function extendConfig(...configs: Config[]) {
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
        }
        if (clonedConfig.queries) {
            formatDeeply(clonedConfig.queries)
        }
        if (clonedConfig.variables) {
            formatDeeply(clonedConfig.variables)
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

    let extendedConfig: Config = {
        animations: {},
        styles: {},
        queries: {},
        variables: {},
    }
    for (let i = 0; i < formattedConfigs.length; i++) {
        const currentFormattedConfig = formattedConfigs[i]
        for (const key in currentFormattedConfig) {
            switch (key) {
                case 'animations':
                    if (currentFormattedConfig.animations) {
                        Object.assign(extendedConfig.animations as AnimationDefinitions, currentFormattedConfig.animations)
                    }
                    break
                default:
                    if (currentFormattedConfig[key as keyof Config]) {
                        extendedConfig = extend(extendedConfig, { [key]: currentFormattedConfig[key as keyof Config] })
                    }
            }
            // if (Object.prototype.hasOwnProperty.call(currentFormattedConfig.styles, key)) {
            //     Object.assign(extendedConfig.styles[key], currentFormattedConfig.styles[key])
            // }
        }
    }

    return extendedConfig
}