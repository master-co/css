import extend from 'json-safe-extend'
import type { Config } from '../types/config'
import { Variable } from '../types/syntax'
import flattenObject from './flatten-object'
import flattenMetaObject from './flatten-meta-object'

export declare type ExtendedConfig = {
    __extended?: boolean
    variables?: Record<string, Variable>
    modes?: Record<string, Record<string, Variable>>
    at?: Record<string, string>
    selectors?: Record<string, string>
    components?: Record<string, string>
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
            const flattened = isExtended ? { ...variables } : flattenMetaObject(variables, [], {})
            Object.assign(extendedConfig.variables, flattened)
        }

        // modes
        if (modes) {
            extendedConfig.modes ??= {}
            for (const [modeName, modeVars] of Object.entries(modes)) {
                const flattenedMode = isExtended ? { ...modeVars } : flattenMetaObject(modeVars, [], {})
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
