import themeConfig from './theme-config'
import type { MasterCSSPlanVariable } from '@master/css'

const themeVariables = themeConfig.variables || []

export function getThemeVariables(namespace: string): MasterCSSPlanVariable[] {
    return themeVariables.filter((variable) => variable.namespace === namespace && variable.value !== undefined)
}

export function getThemeModeVariables(namespace: string, mode: string): MasterCSSPlanVariable[] {
    return themeVariables.flatMap((variable) => {
        const modeVariable = variable.namespace === namespace && variable.modes?.[mode]
        return modeVariable
            ? [{
                ...variable,
                type: modeVariable.type,
                value: modeVariable.value,
                modes: undefined
            }]
            : []
    })
}

export function getThemeNumberVariableEntries(namespace: string) {
    return getThemeVariables(namespace).flatMap(({ key, value }) =>
        typeof value === 'number'
            ? [[key, value] as const]
            : []
    )
}
