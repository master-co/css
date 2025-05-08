import { getProperty, setProperty } from 'dot-prop'
import { Config } from '@master/css'
import toColorValue from './to-color-value'

export default async function getCollectionVariables(id: string, options: { defaultMode?: any, colorSpace?: string } = {}) {
    const { defaultMode, colorSpace } = options
    const collection = await figma.variables.getVariableCollectionByIdAsync(id)
    if (!collection) {
        console.error(`Collection with id ${id} not found`)
        return
    }
    const modeNameById = collection.modes.reduce((a, b) => {
        a[b.modeId] = b.name.toLocaleLowerCase()
        return a
    }, {} as Record<string, string>)
    const modes: Record<string, any> = {}
    const defaultModeName = defaultMode ? defaultMode.name.toLocaleLowerCase() : null
    for (const varId of collection.variableIds) {
        const variable = await figma.variables.getVariableByIdAsync(varId)
        if (!variable) continue
        const dotVarName = variable.name.replace('/', '.')
        for (const varModeId in variable.valuesByMode) {
            const value = variable.valuesByMode[varModeId] as any
            const modeName = modeNameById[varModeId].toLowerCase()
            const dotModeVarName = modeName + '.' + dotVarName
            const dotDefaultModeVarName = defaultModeName + '.' + dotVarName
            const defaultValue = getProperty(modes, dotDefaultModeVarName)
            let current: any = getProperty(modes, dotModeVarName)
            let newValue
            if (value.type === 'VARIABLE_ALIAS') {
                const aliasVariable = await figma.variables.getVariableByIdAsync(value.id)
                newValue = aliasVariable ? `$${aliasVariable.name.replace('/', '-')}` : null
            } if (variable.resolvedType === 'COLOR') {
                newValue = toColorValue(value, colorSpace)
            } else if (variable.resolvedType === 'STRING' || variable.resolvedType === 'FLOAT') {
                newValue = value
            }
            if (newValue === defaultValue) {
                continue
            }
            if (newValue) {
                if (current === undefined) {
                    current = newValue
                    setProperty(modes, dotModeVarName, current)
                } else if (typeof current === 'object') {
                    current[''] = newValue
                }
            }
        }
    }
    let variables: Record<string, any> | undefined
    for (const modeName in modes) {
        if (defaultModeName === modeName) {
            variables = modes[modeName]
            delete modes[modeName]
        }
    }
    let config: Config = {}
    if (variables) {
        config.variables = variables
    }
    if (Object.keys(modes).length > 0) {
        config.modes = modes
    }
    console.log(config)
    return config
}