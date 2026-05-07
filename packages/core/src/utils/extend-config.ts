import extend from 'json-safe-extend'
import UtilityType from '../utility-type'
import type { ComponentDefinitions, Config, UtilityDefinition, VariableDefinitions } from '../types/config'
import flattenObject from './flatten-object'

export declare type ExtendedConfig = {
    __extended?: boolean
    variables?: VariableDefinitions
    modes?: string[]
    atTokens?: Record<string, string | number>
    selectorTokens?: Record<string, string>
    components?: ComponentDefinitions
} & Omit<Config, 'variables' | 'modes' | 'atTokens' | 'selectorTokens'>

type ConfigInput = Config | ExtendedConfig | { config: Config | ExtendedConfig } | undefined

function utilitySlot(utility: UtilityDefinition) {
    return `${utility.name}\0${utility.type === UtilityType.Static ? 'static' : 'syntax'}`
}

function resolveConfigInput(config: ConfigInput) {
    if (!config) return
    return 'config' in config ? config.config : config
}

export default function extendConfig(...configs: ConfigInput[]) {
    let extendedConfig: ExtendedConfig = { __extended: true }

    for (const {
        variables,
        modes,
        components,
        animations,
        atTokens,
        utilities,
        selectorTokens,
        functions,
        ...rest
    } of configs.map(resolveConfigInput).filter(Boolean) as (Config | ExtendedConfig)[]) {
        const isExtended = '__extended' in rest
        if (isExtended) delete rest.__extended

        // variables
        if (variables) {
            extendedConfig.variables ??= []
            for (const variable of variables) {
                const foundIndex = extendedConfig.variables.findIndex((existing) =>
                    existing.key === variable.key
                    && existing.namespace === variable.namespace
                    && existing.mode === variable.mode
                )
                if (foundIndex !== -1) {
                    extendedConfig.variables.splice(foundIndex, 1)
                }
                extendedConfig.variables.push(variable)
            }
        }

        // modes
        if (modes) {
            extendedConfig.modes ??= []
            for (const mode of modes) {
                if (!extendedConfig.modes.includes(mode)) {
                    extendedConfig.modes.push(mode)
                }
            }
        }

        // components
        if (components) {
            extendedConfig.components ??= {}
            Object.assign(extendedConfig.components, components)
        }

        // at tokens
        if (atTokens) {
            extendedConfig.atTokens ??= {}
            Object.assign(extendedConfig.atTokens, flattenObject(atTokens))
        }

        // animations
        if (animations) {
            extendedConfig.animations ??= {}
            Object.assign(extendedConfig.animations, animations)
        }

        // utilities
        if (utilities) {
            extendedConfig.utilities ??= []
            for (const utility of utilities) {
                const slot = utilitySlot(utility)
                const foundIndex = extendedConfig.utilities.findIndex((existing) => utilitySlot(existing) === slot)
                if (foundIndex !== -1) {
                    extendedConfig.utilities.splice(foundIndex, 1)
                }
                extendedConfig.utilities.push(utility)
            }
        }

        // selector tokens
        if (selectorTokens) {
            extendedConfig.selectorTokens ??= {}
            Object.assign(extendedConfig.selectorTokens, selectorTokens)
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
