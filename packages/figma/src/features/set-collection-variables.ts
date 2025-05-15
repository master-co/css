import parseColorValue from '../utils/parse-color-value'
import { Config } from '@master/css'
import { COLOR_VALUE_REGEX } from '@master/css/common'

export default async function setCollectionVariables(config: Config, collection: VariableCollection) {
    const modeIdByName = collection.modes.reduce((acc, mode) => {
        acc[mode.name.toLowerCase()] = mode.modeId
        return acc
    }, {} as Record<string, string>)
    const existingVariables = await figma.variables.getLocalVariablesAsync()
    const nameVariablesMap = new Map(existingVariables
        .filter(v => v.variableCollectionId === collection.id)
        .map(v => [v.name, v]))
    const allModes = { default: config.variables, ...config.modes }
    for (const [modeName, variables] of Object.entries(allModes)) {
        let modeId = modeName === 'default' ? collection.defaultModeId : modeIdByName[modeName.toLowerCase()]
        if (!modeId) {
            modeId = collection.addMode(modeName)
        }
        const addSection = (key: string, sectionOrValue: any, currentName = '') => {
            const fullName = [currentName, key].filter(Boolean).join('/')
            if (typeof sectionOrValue === 'object') {
                for (const [sectionKey, section] of Object.entries(sectionOrValue)) {
                    addSection(sectionKey, section, fullName)
                }
            } else {
                const value = sectionOrValue
                let valueType: VariableResolvedDataType = 'STRING'
                if (typeof value === 'number') {
                    valueType = 'FLOAT'
                } else if (typeof value === 'string') {
                    if (COLOR_VALUE_REGEX.test(value)) {
                        valueType = 'COLOR'
                    }
                }
                let variable = nameVariablesMap.get(fullName)
                if (!variable) {
                    variable = figma.variables.createVariable(
                        fullName,
                        collection,
                        valueType
                    )
                }
                nameVariablesMap.set(fullName, variable)
                if (typeof value === 'string' && value.startsWith('$')) {
                    console.warn(`Variable alias "${value}" is not supported yet`)
                    // TODO: support variable alias
                    // const alias = nameVariablesMap.get(fullName) || existingVariables.find(v => v.name === fullName)
                    // if (alias) {
                    //     variable.setValueForMode(modeId, {
                    //         type: 'VARIABLE_ALIAS',
                    //         id: alias.id,
                    //     })
                    // } else {
                    //     console.warn(`Alias target "${fullName}" not found`)
                    // }
                } else if (valueType === 'COLOR') {
                    const rgba = parseColorValue(value)
                    try {
                        variable.setValueForMode(modeId, rgba)
                    } catch (e) {
                        figma.notify(`Failed to set color value for variable "${fullName}": ${e}`, { error: true })
                    }
                } else {
                    variable.setValueForMode(modeId, value)
                }
            }
        }
        for (const [sectionKey, section] of Object.entries(variables ?? {})) {
            addSection(sectionKey, section)
        }
    }
}
