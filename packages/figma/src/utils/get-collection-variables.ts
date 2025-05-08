import { getProperty, setProperty, hasProperty, deleteProperty } from 'dot-prop'
import { Config } from '@master/css'

export default async function getCollectionVariables(id: string, defaultMode?: any) {
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
        switch (variable.resolvedType) {
            case 'COLOR':
                const dotVarName = variable.name.replace('/', '.')
                for (const varModeId in variable.valuesByMode) {
                    const modeName = modeNameById[varModeId].toLowerCase()
                    const dotModeVarName = modeName + '.' + dotVarName
                    const dotDefaultModeVarName = defaultModeName + '.' + dotVarName
                    const defaultValue = getProperty(modes, dotDefaultModeVarName)
                    let current: any = getProperty(modes, dotModeVarName)
                    const value = variable.valuesByMode[varModeId]
                    let newValue
                    if (typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
                        const aliasVariable = await figma.variables.getVariableByIdAsync(value.id)
                        newValue = aliasVariable ? `$${aliasVariable.name.replace('/', '-')}` : null
                    } else {
                        if (typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value && 'a' in value) {
                            newValue = rgbaToHex(value as RGBA)
                        } else {
                            newValue = null
                        }
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
                break
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

async function getEqualValue(obj: { [x: string]: any; hasOwnProperty?: any }) {
    let firstValue = null
    if (Object.keys(obj).length > 1)
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (firstValue === null) {
                    firstValue = obj[key]
                } else if (obj[key] !== firstValue) {
                    return
                }
            }
        }
    return firstValue
}

function rgbaToHex(rgba: RGBA) {
    const r = Math.floor(rgba.r * 255).toString(16).padStart(2, '0')
    const g = Math.floor(rgba.g * 255).toString(16).padStart(2, '0')
    const b = Math.floor(rgba.b * 255).toString(16).padStart(2, '0')
    const a = rgba.a === 1 ? '' : Math.round(rgba.a * 255).toString(16).padStart(2, '0')
    return `#${r}${g}${b}${a}`
}