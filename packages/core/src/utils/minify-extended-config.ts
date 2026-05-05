import type { VariableDefinition } from '../types/config'
import type { ExtendedConfig } from './extend-config'

function variableSlot(variable: VariableDefinition) {
    return `${variable.namespace ?? ''}\0${variable.key}`
}

function sameValue(a: VariableDefinition | undefined, b: VariableDefinition | undefined) {
    return JSON.stringify(a?.value) === JSON.stringify(b?.value)
}

/**
 * Minifies an extended config by hoisting variables with identical values in every mode
 * into mode-less variables.
 */
export default function minifyExtendedConfig(config: ExtendedConfig): ExtendedConfig {
    const { variables = [], modes = [], ...rest } = config
    if (!modes.length || !variables.length) return config

    const baseVariables = variables.filter((variable) => !variable.mode)
    const modeVariables = variables.filter((variable) => variable.mode)
    const modeVariablesBySlot = new Map<string, Map<string, VariableDefinition>>()

    for (const variable of modeVariables) {
        const slot = variableSlot(variable)
        let byMode = modeVariablesBySlot.get(slot)
        if (!byMode) {
            byMode = new Map()
            modeVariablesBySlot.set(slot, byMode)
        }
        byMode.set(variable.mode!, variable)
    }

    const outputVariables = [...baseVariables]

    for (const [slot, byMode] of modeVariablesBySlot) {
        const first = byMode.get(modes[0])
        const allSame = Boolean(first) && modes.every((mode) => sameValue(byMode.get(mode), first))
        const existingBase = baseVariables.find((variable) => variableSlot(variable) === slot)

        if (allSame && (!existingBase || sameValue(existingBase, first))) {
            if (!existingBase && first) {
                const { mode, ...hoisted } = first
                outputVariables.push(hoisted)
            }
            continue
        }

        outputVariables.push(...byMode.values())
    }

    return {
        ...rest,
        variables: outputVariables.length ? outputVariables : undefined,
        modes
    }
}
