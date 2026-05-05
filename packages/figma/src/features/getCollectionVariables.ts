import type { Config, VariableDefinition } from '@master/css'
import toColorValue from '../utils/to-color-value'
// import minifyExtendedConfig from '@master/css/utils/minify-extended-config'

export interface GetCollectionVariablesOptions {
    varCollId: string
    outputColorSpace?: string
    defaultVarMode?: any
}

export default async function getCollectionVariables(options: GetCollectionVariablesOptions) {
    const collection = await figma.variables.getVariableCollectionByIdAsync(options.varCollId)
    if (!collection) {
        figma.notify(`Variable collection "${options.varCollId}" not found`, { error: true })
        return
    }
    const modeNameById = collection.modes.reduce((a, b) => {
        a[b.modeId] = b.name.toLocaleLowerCase()
        return a
    }, {} as Record<string, string>)
    const modes: Record<string, Record<string, any>> = {}
    const defaultModeName = options.defaultVarMode ? options.defaultVarMode.name.toLocaleLowerCase() : null
    for (const varId of collection.variableIds) {
        const variable = await figma.variables.getVariableByIdAsync(varId)
        if (!variable) continue
        const normalizedName = variable.name.toLocaleLowerCase().replace(/ /g, '-')
        const variableNameSplits = normalizedName.split('/')
        const key = variableNameSplits[variableNameSplits.length - 1]
        const groups = variableNameSplits.slice(0, variableNameSplits.length - 1)
        const group = groups.join('.') || undefined
        const name = normalizedName.replace(/\//g, '-')
        const namespace = groups[0]
        for (const varModeId in variable.valuesByMode) {
            const value = variable.valuesByMode[varModeId] as any
            const modeName = modeNameById[varModeId].toLowerCase()
            let modeVariables = modes[modeName]
            let newValue
            if (value.type === 'VARIABLE_ALIAS') {
                const aliasVariable = await figma.variables.getVariableByIdAsync(value.id)
                newValue = aliasVariable
                    ? `$${aliasVariable.name.toLocaleLowerCase()
                        .replace(/ /g, '-')
                        .replace(/\//g, '-')}`
                    : undefined
            } else if (variable.resolvedType === 'COLOR') {
                newValue = toColorValue(value, options.outputColorSpace)
            } else if (variable.resolvedType === 'STRING' || variable.resolvedType === 'FLOAT') {
                newValue = value
            }
            if (modeVariables === undefined) {
                modeVariables = {}
                modes[modeName] = modeVariables
            }
            modeVariables[name] = {
                name,
                key,
                group,
                namespace,
                value: newValue,
            }
        }
    }
    let variables: Record<string, any> | undefined
    if (defaultModeName && modes[defaultModeName]) {
        variables = modes[defaultModeName]
        delete modes[defaultModeName]
    }

    const toVariableDefinitions = (source: Record<string, any>, mode?: string): VariableDefinition[] =>
        Object.values(source).map(({ group, key, value }) => ({
            ...(group ? { namespace: group } : {}),
            key,
            value,
            ...(mode ? { mode } : {})
        }))

    let config: Config = {}
    const modeNames = Object.keys(modes)
    const variableDefinitions = [
        ...(variables ? toVariableDefinitions(variables) : []),
        ...modeNames.flatMap((modeName) => toVariableDefinitions(modes[modeName], modeName))
    ]
    if (variableDefinitions.length) {
        config.variables = variableDefinitions
    }
    if (modeNames.length > 0) {
        config.modes = modeNames
    }
    return config
}
