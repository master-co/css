import extend from '@techor/extend'
import type { Config, AnimationDefinitions } from '../types/config'
import { Variable } from '../types/syntax'

export const EXTENDED = Symbol('extended')

// Flatten with conditional metadata for variables/modes
function flattenVariables(
    obj: Record<string, any> & { [EXTENDED]?: boolean },
    name: string[] = [],
    result: Record<string, any> & { [EXTENDED]: boolean } = {
        [EXTENDED]: true
    }
) {
    if (obj[EXTENDED]) return obj
    for (const [key, value] of Object.entries(obj)) {
        const nextName = [...name, key].filter(Boolean)
        const isValueArray = Array.isArray(value)
        if (value && typeof value === 'object' && !isValueArray) {
            // Handle {'': value} to mean "self"
            if (Object.keys(value).length === 1 && '' in value) {
                const flatKey = nextName.join('-')
                result[flatKey] = {
                    key,
                    name: flatKey,
                    value: value['']
                }
            } else {
                flattenVariables(value, nextName, result)
            }
        } else {
            const flatKey = nextName.join('-')
            const groups = nextName.slice(0, -1).filter(Boolean)
            const newValue = isValueArray ? value.join(',') : value
            result[flatKey] =
                groups.length === 0
                    ? {
                        key,
                        name: flatKey,
                        value: newValue
                    }
                    : {
                        group: groups.join('.'),
                        namespace: nextName[0],
                        name: flatKey,
                        value: newValue,
                        key
                    }
        }
    }
    return result
}

// Flatten plain object to flat key-value pairs (no metadata)
function flattenPlainValues(
    obj: Record<string, any> & { [EXTENDED]?: boolean },
    name: string[] = [],
    result: Record<string, any> & { [EXTENDED]: boolean } = {
        [EXTENDED]: true
    }
) {
    if (obj[EXTENDED]) return obj
    for (const [key, value] of Object.entries(obj)) {
        const nextName = [...name, key].filter(Boolean)
        const flatKey = nextName.join('-')
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            flattenPlainValues(value, nextName, result)
        } else {
            result[flatKey] = value
        }
    }
    return result
}

export declare type ExtendedConfig = {
    [EXTENDED]: boolean
    variables?: Record<string, Variable>
    modes?: Record<string, Record<string, Variable>>
} & Omit<Config, 'variables' | 'modes'>

export default function extendConfig(...configs: (Config | undefined)[]) {
    const collectConfigs = (config: Config | ExtendedConfig | undefined, result: (Config | ExtendedConfig)[] = []): (Config | ExtendedConfig)[] => {
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

    const allConfigs = configs.reduce<(Config | ExtendedConfig)[]>((acc, config) => collectConfigs(config, acc), [])

    let extendedConfig: ExtendedConfig = {
        animations: {},
        components: {},
        at: {},
        variables: {},
        modes: {},
        rules: {},
        utilities: {},
        screens: {},
        selectors: {},
        functions: {},
        [EXTENDED]: false
    }

    for (const { variables, modes, components, animations, at, rules, utilities, selectors, screens, functions, ...rest } of allConfigs) {
        // Flatten variables
        if (variables) {
            const flattened = flattenVariables(variables)
            Object.assign(extendedConfig.variables!, flattened)
        }

        // Flatten modes (from 2nd layer only)
        if (modes) {
            for (const [modeName, modeVars] of Object.entries(modes)) {
                const flattenedMode = flattenVariables(modeVars)
                if (!extendedConfig.modes![modeName]) {
                    extendedConfig.modes![modeName] = {}
                }
                Object.assign(extendedConfig.modes![modeName], flattenedMode)
            }
        }

        // Flatten components (flat key → value only)
        if (components) {
            const flattened = flattenPlainValues(components)
            Object.assign(extendedConfig.components!, flattened)
        }

        // Flatten at (flat key → value only)
        if (at) {
            const flattened = flattenPlainValues(at)
            Object.assign(extendedConfig.at!, flattened)
        }

        // Merge animations
        if (animations) {
            Object.assign(extendedConfig.animations!, animations)
        }

        // Merge rules
        if (rules) {
            Object.assign(extendedConfig.rules!, rules)
        }

        // Merge utilities
        if (utilities) {
            Object.assign(extendedConfig.utilities!, utilities)
        }

        // Merge screens
        if (screens) {
            Object.assign(extendedConfig.screens!, screens)
        }

        // Merge selectors
        if (selectors) {
            Object.assign(extendedConfig.selectors!, selectors)
        }

        // Merge functions
        if (functions) {
            Object.assign(extendedConfig.functions!, functions)
        }

        extendedConfig = extend({}, extendedConfig, rest) as ExtendedConfig
    }

    // Clean up empty objects
    for (const key in extendedConfig) {
        const typedKey = key as keyof Config
        if (
            typeof extendedConfig[typedKey] === 'object' &&
            Object.keys(extendedConfig[typedKey] as object).length === 0
        ) {
            delete extendedConfig[typedKey]
        }
    }

    extendedConfig[EXTENDED] = true

    return extendedConfig
}
