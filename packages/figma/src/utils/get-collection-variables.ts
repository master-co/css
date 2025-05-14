import { getProperty, setProperty } from 'dot-prop'
import { Config } from '@master/css'
import toColorValue from './to-color-value'
import nestMetaObject from '@master/css/utils/nest-meta-object'
import minifyExtendedConfig from '@master/css/utils/minify-extended-config'

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
        const variableNameSplits = variable.name.split('/')
        const key = variableNameSplits[variableNameSplits.length - 1]
        const groups = variableNameSplits.slice(0, variableNameSplits.length - 1)
        const group = groups.join('.') || undefined
        const name = variable.name.replace('/', '-')
        const namespace = groups[0]
        for (const varModeId in variable.valuesByMode) {
            const value = variable.valuesByMode[varModeId] as any
            const modeName = modeNameById[varModeId].toLowerCase()
            let modeVariables: any = getProperty(modes, modeName)
            let newValue
            if (value.type === 'VARIABLE_ALIAS') {
                const aliasVariable = await figma.variables.getVariableByIdAsync(value.id)
                newValue = aliasVariable ? `$${aliasVariable.name.replace('/', '-')}` : undefined
            } else if (variable.resolvedType === 'COLOR') {
                newValue = toColorValue(value, colorSpace)
            } else if (variable.resolvedType === 'STRING' || variable.resolvedType === 'FLOAT') {
                newValue = value
            }
            if (modeVariables === undefined) {
                modeVariables = {}
                setProperty(modes, modeName, modeVariables)
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

    const minifiedExtendedConfig = minifyExtendedConfig({ variables, modes })

    let config: Config = {}
    if (minifiedExtendedConfig.variables) {
        config.variables = nestMetaObject(minifiedExtendedConfig.variables)
    }
    if (Object.keys(minifiedExtendedConfig.modes || []).length > 0) {
        config.modes = {}
        for (const modeName in minifiedExtendedConfig.modes) {
            config.modes[modeName] = nestMetaObject(minifiedExtendedConfig.modes[modeName])
        }
    }
    return config
}