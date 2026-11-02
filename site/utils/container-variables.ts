import { getThemeNumberVariableEntries } from '@master/internal-site/css/theme-variables.ts'

export const containerVariableEntries = getThemeNumberVariableEntries('container')

export const containerVariableValues = Object.fromEntries(containerVariableEntries) as Record<string, number>
