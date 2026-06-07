import { getThemeNumberVariableEntries } from './theme-variables'

export const breakpointVariableEntries = getThemeNumberVariableEntries('breakpoint')

export const breakpointVariableValues = Object.fromEntries(breakpointVariableEntries) as Record<string, number>
