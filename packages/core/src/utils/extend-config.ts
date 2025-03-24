import extend from '@techor/extend'
import type { AnimationDefinitions, Config } from '../types/config'

// todo: split resolveConfig into a function
export default function extendConfig(...configs: (Config | undefined)[]) {
    const formatConfig = (config: Config): Config => {
        const clonedConfig: Config = extend({}, config)
        const formatDeeply = (obj: Record<string, any>) => {
            Object.entries(obj).forEach(([key, value]) => {
                if (typeof value === 'object' && !Array.isArray(value)) {
                    formatDeeply(value)
                } else if (key && !key.startsWith('@')) {
                    obj[key] = { '': value }
                }
            })
        }
        ['components', 'at', 'variables'].forEach((key) => {
            if (clonedConfig[key as keyof Config]) {
                formatDeeply(clonedConfig[key as keyof Config] as Record<string, any>)
            }
        })

        return clonedConfig
    }
    const collectConfigs = (config: Config | undefined, result: Config[] = []): Config[] => {
        if (!config) return result
        if (config.extends?.length) {
            config.extends.forEach((ext) =>
                collectConfigs('config' in ext ? ext.config : ext, result)
            )
        }
        result.push(formatConfig(config))
        return result
    }
    const formattedConfigs = configs.reduce<Config[]>((acc, config) => collectConfigs(config, acc), [])
    return formattedConfigs.reduce<Config>(
        (extendedConfig, currentConfig) => {
            Object.entries(currentConfig).forEach(([key, value]) => {
                if (key === 'animations' && value) {
                    Object.assign(extendedConfig.animations as AnimationDefinitions, value)
                } else if (value) {
                    extendedConfig = extend(extendedConfig, { [key]: value })
                }
            })
            return extendedConfig
        },
        { animations: {}, components: {}, at: {}, variables: {} }
    )
}
