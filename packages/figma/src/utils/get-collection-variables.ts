export default async function getCollectionVariables(id: string) {
    const collection = await figma.variables.getVariableCollectionByIdAsync(id)
    if (!collection) {
        console.error(`Collection with id ${id} not found`)
        return
    }

    const modeNameById = collection.modes.reduce((a: Record<string, string>, b) => {
        a[b.modeId] = b.name
        return a
    }, {} as Record<string, string>)
    const modeLength = collection.modes.length
    const config: Record<string, any> = {}
    for (const eachVariableId of collection.variableIds) {
        const variable = await figma.variables.getVariableByIdAsync(eachVariableId)
        if (variable && variable.resolvedType === 'COLOR') {
            const [colorName, level] = variable.name.split('/')
            const currentColors = Object.prototype.hasOwnProperty.call(config, colorName)
                ? config[colorName]
                : (config[colorName] = {})
            let eachThemeColors: any = {}
            for (const eachModeId in variable.valuesByMode) {
                const modeName = modeNameById[eachModeId].toLowerCase()
                const suffix = (modeName !== 'default' && modeLength > 1) ? ('@' + modeName) : ''
                const values = variable.valuesByMode[eachModeId]
                let resolvedValue
                if (typeof values === 'object' && 'type' in values && values.type === 'VARIABLE_ALIAS') {
                    const aliasVariable = await figma.variables.getVariableByIdAsync(values.id)
                    resolvedValue = aliasVariable ? `$(${aliasVariable.name.replace('/', '-')})` : null
                } else {
                    if (typeof values === 'object' && 'r' in values && 'g' in values && 'b' in values && 'a' in values) {
                        resolvedValue = rgbaToHex(values as RGBA)
                    } else {
                        resolvedValue = null
                    }
                }
                modeLength > 1
                    ? eachThemeColors[suffix] = resolvedValue
                    : eachThemeColors = resolvedValue !== null ? resolvedValue : {}
            }
            const equalValue = await getEqualValue(eachThemeColors)
            if (equalValue) {
                eachThemeColors = equalValue
            }
            currentColors[level || ''] = eachThemeColors
            if (!level && Object.keys(currentColors).length === 1) {
                config[colorName] = eachThemeColors
            }
        }
    }
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