import type { ExtendedConfig } from './extend-config'
import type { Variable } from '@master/css/types/syntax'

/**
 * Minifies an extended config by hoisting shared variables from all modes into `variables`.
 * Only variables with identical values across all modes are hoisted.
 *
 * @param config - The extended config with flattened variable structures
 * @returns A new config with deduplicated `variables` and minimized `modes`
 */
export default function minifyExtendedConfig(config: ExtendedConfig): ExtendedConfig {
    const { variables: baseVariables = {}, modes = {}, ...rest } = config

    const modeNames = Object.keys(modes)
    const variableNames = new Set<string>()

    // Collect all variable keys from all modes
    for (const mode of modeNames) {
        for (const key in modes[mode]) {
            variableNames.add(key)
        }
    }

    const variables: Record<string, Variable> = { ...baseVariables }
    const newModes: Record<string, Record<string, Variable>> = {}

    for (const key of variableNames) {
        let first: Variable | undefined
        let allSame = true

        for (let i = 0; i < modeNames.length; i++) {
            const mode = modeNames[i]
            const current = modes[mode]?.[key]

            if (!current) {
                allSame = false
                break
            }

            if (i === 0) {
                first = current
            } else if (JSON.stringify(current.value) !== JSON.stringify(first!.value)) {
                allSame = false
                break
            }
        }

        const already = baseVariables[key]
        const valueMatches = already && JSON.stringify(already.value) === JSON.stringify(first?.value)

        if (allSame && (!already || valueMatches)) {
            if (first) {
                variables[key] = first
            }
        } else {
            for (const mode of modeNames) {
                if (!newModes[mode]) newModes[mode] = {}
                const value = modes[mode]?.[key]
                if (value) {
                    newModes[mode][key] = value
                }
            }
        }
    }

    const newConfig: ExtendedConfig = {
        ...rest,
        variables: Object.keys(variables).length > 0 ? variables : undefined,
        modes: Object.keys(newModes).length > 0 ? newModes : undefined,
    }

    return newConfig
}
