import {
    type CSSDirectiveConfig,
    type CSSDirectiveResult,
    type CSSDirectiveUtilityDefinition,
    type CSSDirectiveUtilityRuleDefinition,
    type CSSDirectiveVariableDefinition
} from 'shared/css-directives'
import type { Config, ModeDefinitions, UtilityDefinition, UtilityRuleDefinition, VariableDefinition, VariableDefinitions } from 'shared/css-config'
import UtilityType from 'shared/utility-type'
import functions from '../functions'
import utilities from '../utilities'
import resolveVariableNamespace from './resolve-variable-namespace'

type CSSDirectiveInput = CSSDirectiveResult | CSSDirectiveConfig
type ConfigInput = CSSDirectiveInput | Config
type InputUtilityDefinition = CSSDirectiveUtilityDefinition | UtilityDefinition
type InputVariableDefinition = CSSDirectiveVariableDefinition | VariableDefinition

function isCSSDirectiveResult(input: ConfigInput): input is CSSDirectiveResult {
    return 'config' in input
}

function getInputConfig(input: ConfigInput) {
    return isCSSDirectiveResult(input) ? input.config : input
}

function cloneUtilityRule(rule: CSSDirectiveUtilityRuleDefinition | UtilityRuleDefinition): UtilityRuleDefinition {
    return {
        declarations: { ...rule.declarations },
        ...(rule.selector ? { selector: rule.selector } : {}),
        ...(rule.atRules?.length ? { atRules: [...rule.atRules] } : {})
    }
}

function resolveUtilityType(type: InputUtilityDefinition['type']) {
    return type === 'static' ? UtilityType.Static : type
}

function cloneUtility(definition: InputUtilityDefinition): UtilityDefinition {
    const type = resolveUtilityType(definition.type)
    return {
        ...definition,
        ...(type !== undefined ? { type } : {}),
        ...(definition.declarations
            ? {
                declarations: Array.isArray(definition.declarations)
                    ? [...definition.declarations]
                    : { ...definition.declarations }
            }
            : {}),
        ...(definition.atRules?.length ? { atRules: [...definition.atRules] } : {}),
        ...(definition.rules?.length ? { rules: definition.rules.map(cloneUtilityRule) } : {})
    } as UtilityDefinition
}

function addMode(config: Config, mode: string) {
    config.modes ??= []
    if (!config.modes.includes(mode)) config.modes.push(mode)
}

function resolveInputVariable(variable: InputVariableDefinition): VariableDefinition {
    if ('key' in variable && variable.key !== undefined) {
        return {
            ...(variable.namespace ? { namespace: variable.namespace } : {}),
            key: variable.key,
            value: variable.value,
            ...(variable.mode ? { mode: variable.mode } : {})
        }
    }

    const directiveVariable = variable as CSSDirectiveVariableDefinition
    const resolved = resolveVariableNamespace(directiveVariable.name)
    if (directiveVariable.mode && resolved.namespace === 'screen') {
        throw new Error(`Screen variables cannot be mode-specific: screen-${resolved.key}@${directiveVariable.mode}`)
    }
    return {
        ...(resolved.namespace ? { namespace: resolved.namespace } : {}),
        key: resolved.key,
        value: directiveVariable.value,
        ...(directiveVariable.mode ? { mode: directiveVariable.mode } : {})
    }
}

function variableSlot(variable: VariableDefinition) {
    return [
        variable.key,
        variable.namespace || '',
        variable.mode || ''
    ].join('\0')
}

function addVariable(config: Config, variable: InputVariableDefinition) {
    const definition = resolveInputVariable(variable)
    if (definition.mode) addMode(config, definition.mode)
    config.variables ??= []
    const foundIndex = config.variables.findIndex((existing) => variableSlot(existing) === variableSlot(definition))
    if (foundIndex !== -1) config.variables.splice(foundIndex, 1)
    config.variables.push(definition)
}

function utilitySlot(utility: UtilityDefinition) {
    return [
        utility.name,
        utility.type === UtilityType.Static ? 'static' : 'syntax',
        utility.type === UtilityType.Static ? (utility.layer || 'general') : ''
    ].join('\0')
}

function mergeUtilities(...utilityGroups: (UtilityDefinition[] | undefined)[]) {
    const utilityMap = new Map<string, UtilityDefinition>()
    for (const utility of utilityGroups.flatMap((group) => group || [])) {
        const slot = utilitySlot(utility)
        if (utilityMap.has(slot)) utilityMap.delete(slot)
        utilityMap.set(slot, utility)
    }
    return Array.from(utilityMap.values())
}

function orderVariables(variables: VariableDefinitions = []) {
    return [
        ...variables.filter(({ namespace }) => namespace !== 'screen'),
        ...variables.filter(({ namespace }) => namespace === 'screen')
    ] satisfies VariableDefinitions
}

function resolveModes(config: Config, variables: VariableDefinitions) {
    return config.modes?.length
        ? config.modes
        : [...new Set(variables.map(({ mode }) => mode).filter(Boolean))] as ModeDefinitions
}

export function createConfig(input: ConfigInput = {}) {
    const inputConfig = getInputConfig(input)
    const config: Config = {}
    if (inputConfig.rootSize !== undefined) config.rootSize = inputConfig.rootSize
    if (inputConfig.baseUnit !== undefined) config.baseUnit = inputConfig.baseUnit
    if (inputConfig.defaultMode !== undefined) config.defaultMode = inputConfig.defaultMode
    if (inputConfig.modeTrigger !== undefined) config.modeTrigger = inputConfig.modeTrigger
    if (inputConfig.scope !== undefined) config.scope = inputConfig.scope
    if (inputConfig.important !== undefined) config.important = inputConfig.important
    if (inputConfig.atTokens) config.atTokens = { ...inputConfig.atTokens }
    if (inputConfig.selectorTokens) config.selectorTokens = { ...inputConfig.selectorTokens }
    if (inputConfig.animations) config.animations = { ...inputConfig.animations }
    if (inputConfig.utilities?.length) config.utilities = inputConfig.utilities.map(cloneUtility)
    if ('functions' in inputConfig && inputConfig.functions) config.functions = { ...inputConfig.functions }

    for (const mode of inputConfig.modes || []) {
        addMode(config, mode)
    }
    for (const variable of inputConfig.variables || []) {
        addVariable(config, variable as InputVariableDefinition)
    }

    return config
}

export default function createDefaultConfig(input: ConfigInput = {}) {
    const inputConfig = createConfig(input)
    const variables = orderVariables(inputConfig.variables)
    const modes = resolveModes(inputConfig, variables)

    return {
        ...inputConfig,
        atTokens: inputConfig.atTokens || {},
        selectorTokens: inputConfig.selectorTokens || {},
        utilities: mergeUtilities(utilities, inputConfig.utilities),
        functions: { ...functions, ...inputConfig.functions },
        animations: inputConfig.animations || {},
        variables,
        modes,
        scope: inputConfig.scope ?? '',
        rootSize: inputConfig.rootSize ?? 16,
        baseUnit: inputConfig.baseUnit ?? 4,
        important: inputConfig.important ?? false,
        defaultMode: inputConfig.defaultMode ?? 'light',
        modeTrigger: inputConfig.modeTrigger ?? 'media'
    } satisfies Config
}
