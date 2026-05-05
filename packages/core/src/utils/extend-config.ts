import extend from 'json-safe-extend'
import SyntaxRuleType from '../syntax-rule-type'
import type { ComponentDefinitions, Config, SyntaxRuleDefinition, VariableDefinitions } from '../types/config'
import flattenObject from './flatten-object'

export declare type ExtendedConfig = {
    __extended?: boolean
    variables?: VariableDefinitions
    modes?: string[]
    atRuleAliases?: Record<string, string | number>
    selectorAliases?: Record<string, string>
    components?: ComponentDefinitions
} & Omit<Config, 'variables' | 'modes' | 'atRuleAliases' | 'selectorAliases'>

function ruleSlot(rule: SyntaxRuleDefinition) {
    return `${rule.name}\0${rule.type === SyntaxRuleType.Static ? 'static' : 'syntax'}`
}

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
        atRuleAliases,
        rules,
        selectorAliases,
        functions,
        ...rest
    } of allConfigs) {
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

        // at-rule aliases
        if (atRuleAliases) {
            extendedConfig.atRuleAliases ??= {}
            Object.assign(extendedConfig.atRuleAliases, flattenObject(atRuleAliases))
        }

        // animations
        if (animations) {
            extendedConfig.animations ??= {}
            Object.assign(extendedConfig.animations, animations)
        }

        // rules
        if (rules) {
            extendedConfig.rules ??= []
            for (const rule of rules) {
                const slot = ruleSlot(rule)
                const foundIndex = extendedConfig.rules.findIndex((existing) => ruleSlot(existing) === slot)
                if (foundIndex !== -1) {
                    extendedConfig.rules.splice(foundIndex, 1)
                }
                extendedConfig.rules.push(rule)
            }
        }

        // selector aliases
        if (selectorAliases) {
            extendedConfig.selectorAliases ??= {}
            Object.assign(extendedConfig.selectorAliases, selectorAliases)
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
