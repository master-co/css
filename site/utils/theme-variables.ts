import presetManifest from './preset-manifest'
import {
  flattenMasterCSSManifestVariables,
  type MasterCSSManifest,
  type MasterCSSManifestVariable
} from '@master/css-schema/manifest'

const presetVariables = flattenMasterCSSManifestVariables((presetManifest as MasterCSSManifest).variables)
const rootSize = presetManifest.settings?.rootSize || 16

export interface ThemeNumericVariableEntry {
  key: string
  value: string
  unit?: string
  px: number
  rem: number
}

export function getThemeVariables(namespace: string): MasterCSSManifestVariable[] {
  return presetVariables.filter((variable) => variable.namespace === namespace && variable.value !== undefined)
}

export function getThemeModeVariables(namespace: string, mode: string): MasterCSSManifestVariable[] {
  return presetVariables.flatMap((variable) => {
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
  return getThemeNumericVariableEntries(namespace).map(({ key, px }) => [key, px] as const)
}

function getNumericRemValue(variable: MasterCSSManifestVariable) {
  if (!variable.numeric && typeof variable.value !== 'number') return
  const numeric = variable.numeric || { value: variable.value as number }
  switch (numeric.unit) {
    case 'rem':
      return numeric.value
    case undefined:
    case '':
    case 'px':
      return numeric.value / rootSize
    default:
      return
  }
}

function getNumericUnit(variable: MasterCSSManifestVariable) {
  return variable.numeric?.unit
}

export function getThemeNumericVariableEntries(namespace: string): ThemeNumericVariableEntry[] {
  return getThemeVariables(namespace).flatMap((variable) => {
    const rem = getNumericRemValue(variable)
    if (rem === undefined || variable.value === undefined) return []
    return [{
      key: variable.key,
      value: String(variable.value),
      ...(getNumericUnit(variable) ? { unit: getNumericUnit(variable) } : {}),
      px: rem * rootSize,
      rem
    }]
  })
}
