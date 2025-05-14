import extend from 'json-safe-extend'
import type { Config } from '../types/config'
import { Variable } from '../types/syntax'

function flattenObject(
    obj: Record<string, any>,
    name: string[] = [],
    result: Record<string, any> = {},
    withMeta = false
) {
    for (const [key, value] of Object.entries(obj)) {
        const nextName = [...name, key].filter(Boolean)
        const flatKey = nextName.join('-')

        if (value && typeof value === 'object' && !Array.isArray(value)) {
            if (withMeta && Object.keys(value).length === 1 && '' in value) {
                result[flatKey] = {
                    key,
                    name: flatKey,
                    value: value['']
                }
            } else {
                flattenObject(value, nextName, result, withMeta)
            }
        } else {
            const newValue = Array.isArray(value) ? value.join(',') : value
            if (withMeta && nextName.length > 1) {
                result[flatKey] = {
                    group: nextName.slice(0, -1).filter(Boolean).join('.'),
                    namespace: nextName[0],
                    name: flatKey,
                    value: newValue,
                    key
                }
            } else if (withMeta) {
                result[flatKey] = {
                    key,
                    name: flatKey,
                    value: newValue
                }
            } else {
                result[flatKey] = newValue
            }
        }
    }

    return result
}

export declare type ExtendedConfig = {
    __extended?: boolean
    variables?: Record<string, Variable>
    modes?: Record<string, Record<string, Variable>>
} & Omit<Config, 'variables' | 'modes'>

export default function extendConfig(...configs: (Config | undefined)[]) {
    const collectConfigs = (
        config: Config | ExtendedConfig | undefined,
        result: (Config | ExtendedConfig)[] = []
    ): (Config | ExtendedConfig)[] => {
        if (!config) return result
        if (config.extends?.length) {
            for (const ext of config.extends) {
                collectConfigs('config' in ext ? ext.config : ext, result)
            }
        }
        const cleanConfig = { ...config }
        delete cleanConfig.extends
        result.push(cleanConfig)
        return result
    }

    const allConfigs = configs.reduce<(Config | ExtendedConfig)[]>(
        (acc, config) => collectConfigs(config, acc),
        []
    )

    let extendedConfig: ExtendedConfig = { __extended: true }

    for (const {
        variables,
        modes,
        components,
        animations,
        at,
        rules,
        utilities,
        selectors,
        functions,
        ...rest
    } of allConfigs) {
        const isExtended = '__extended' in rest
        if (isExtended) delete rest.__extended

        // variables
        if (variables) {
            extendedConfig.variables ??= {}
            const flattened = isExtended ? { ...variables } : flattenObject(variables, [], {}, true)
            Object.assign(extendedConfig.variables, flattened)
        }

        // modes
        if (modes) {
            extendedConfig.modes ??= {}
            for (const [modeName, modeVars] of Object.entries(modes)) {
                const flattenedMode = isExtended ? { ...modeVars } : flattenObject(modeVars, [], {}, true)
                extendedConfig.modes[modeName] = {
                    ...extendedConfig.modes[modeName],
                    ...flattenedMode
                }
            }
        }

        // components
        if (components) {
            extendedConfig.components ??= {}
            const flattened = isExtended ? { ...components } : flattenObject(components)
            Object.assign(extendedConfig.components, flattened)
        }

        // at
        if (at) {
            extendedConfig.at ??= {}
            const flattened = isExtended ? { ...at } : flattenObject(at)
            Object.assign(extendedConfig.at, flattened)
        }

        // animations
        if (animations) {
            extendedConfig.animations ??= {}
            Object.assign(extendedConfig.animations, animations)
        }

        // rules
        if (rules) {
            extendedConfig.rules ??= {}
            Object.assign(extendedConfig.rules, rules)
        }

        // utilities
        if (utilities) {
            extendedConfig.utilities ??= {}
            Object.assign(extendedConfig.utilities, utilities)
        }

        // selectors
        if (selectors) {
            extendedConfig.selectors ??= {}
            Object.assign(extendedConfig.selectors, selectors)
        }

        // functions
        if (functions) {
            extendedConfig.functions ??= {}
            Object.assign(extendedConfig.functions, functions)
        }

        // merge the rest (non-structured fields)
        extendedConfig = extend({}, extendedConfig, rest) as ExtendedConfig
    }

    return extendedConfig
}
