import themeConfig from './theme-config'
import type { VariableDefinition } from '@master/css'

const themeVariables = themeConfig.variables || []

export function getThemeVariables(namespace: string): VariableDefinition[] {
    return themeVariables.filter((variable) => variable.namespace === namespace && !variable.mode)
}

export function getThemeModeVariables(namespace: string, mode: string): VariableDefinition[] {
    return themeVariables.filter((variable) => variable.namespace === namespace && variable.mode === mode)
}

export function getThemeNumberVariableEntries(namespace: string) {
    return getThemeVariables(namespace).flatMap(({ key, value }) =>
        typeof value === 'number'
            ? [[key, value] as const]
            : []
    )
}
