import { getThemeNumberVariableEntries } from './theme-variables'

export const screenVariableEntries = getThemeNumberVariableEntries('screen')

export const screenVariableValues = Object.fromEntries(screenVariableEntries) as Record<string, number>
