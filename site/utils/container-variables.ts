import { getThemeNumberVariableEntries } from './theme-variables'

export const containerVariableEntries = getThemeNumberVariableEntries('container')

export const containerVariableValues = Object.fromEntries(containerVariableEntries) as Record<string, number>
