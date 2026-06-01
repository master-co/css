import extend from 'json-safe-extend'
import UtilityType from 'shared/utility-type'
import type { Config, UtilityDefinition, VariableDefinition, VariableDefinitions } from 'shared/css-config'
import flattenObject from './flatten-object'

export declare type ExtendedConfig = {
    __extended?: boolean
    variables?: VariableDefinitions
    modes?: string[]
    atTokens?: Record<string, string | number>
    selectorTokens?: Record<string, string>
} & Omit<Config, 'variables' | 'modes' | 'atTokens' | 'selectorTokens'>

type ConfigInput = Config | ExtendedConfig | { config: Config | ExtendedConfig } | undefined

function utilitySlot(utility: UtilityDefinition) {
    return [
        utility.name,
        utility.type === UtilityType.Static ? 'static' : 'syntax',
        utility.type === UtilityType.Static ? (utility.layer || 'general') : ''
    ].join('\0')
}

function variableSlot(variable: VariableDefinition) {
    return [
        variable.key,
        variable.namespace || '',
        variable.mode || ''
    ].join('\0')
}

function resolveConfigInput(config: ConfigInput) {
    if (!config) return
    return 'config' in config ? config.config : config
}

export default function extendConfig(...configs: ConfigInput[]) {
    let extendedConfig: ExtendedConfig = { __extended: true }
    const variableMap = new Map<string, VariableDefinition>()
    const modeSet = new Set<string>()
    const utilityMap = new Map<string, UtilityDefinition>()
    let hasVariables = false
    let hasModes = false
    let hasUtilities = false

    for (const {
        variables,
        modes,
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
            hasVariables = true
            for (const variable of variables) {
                const slot = variableSlot(variable)
                if (variableMap.has(slot)) {
                    variableMap.delete(slot)
                }
                variableMap.set(slot, variable)
            }
        }

        // modes
        if (modes) {
            hasModes = true
            for (const mode of modes) {
                modeSet.add(mode)
            }
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
            hasUtilities = true
            for (const utility of utilities) {
                const slot = utilitySlot(utility)
                if (utilityMap.has(slot)) {
                    utilityMap.delete(slot)
                }
                utilityMap.set(slot, utility)
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

    if (hasVariables) extendedConfig.variables = Array.from(variableMap.values())
    if (hasModes) extendedConfig.modes = Array.from(modeSet)
    if (hasUtilities) extendedConfig.utilities = Array.from(utilityMap.values())

    return extendedConfig
}
