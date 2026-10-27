import presetManifest from './preset-manifest'
import {
  flattenMasterCSSManifestVariables,
  type MasterCSSManifest,
  type MasterCSSManifestVariable
} from '@master/css-schema/manifest'

const presetVariables = flattenMasterCSSManifestVariables((presetManifest as MasterCSSManifest).variables)
// Display-only equivalents for the documentation preview, never compiler units.
const previewRootPixels = 16

export interface ThemeNumericVariableEntry {
  key: string
  value: string
  unit?: string
  px: number
  rem: number
}

// Documentation displays authored values for a specific scope, never computed browser values.
export type ThemeDisplayVariable = MasterCSSManifestVariable & { value: string }
export function getThemeVariables(namespace: string): ThemeDisplayVariable[] {
  return presetVariables.flatMap(variable => {
    const entry = variable.namespace === namespace && variable.values.find(value => value.path.length === 1 && value.path[0] === ':root,:host')
    return entry ? [{ ...variable, value: entry.value }] : []
  })
}

export function getThemeNumberVariableEntries(namespace: string) {
  return getThemeNumericVariableEntries(namespace).map(({ key, px }) => [key, px] as const)
}

function getNumericRemValue(variable: MasterCSSManifestVariable) {
  if (!variable.numeric) return
  const numeric = variable.numeric
  switch (numeric.unit) {
    case 'rem':
      return numeric.value
    case undefined:
    case '':
    case 'px':
      return numeric.value / previewRootPixels
    default:
      return
  }
}

function getNumericUnit(variable: MasterCSSManifestVariable) {
  return variable.numeric?.unit
}

export function getThemeNumericVariableEntries(namespace: string): ThemeNumericVariableEntry[] {
  if (namespace === 'breakpoint') {
    return Object.entries(presetManifest.customMedia || {}).flatMap(([name, expression]) => {
      if (expression.type !== 'feature') return []
      const match = expression.value.match(/^\(width\s*>=\s*([\d.]+)(rem|px)\)$/)
      if (!match) return []
      const value = Number(match[1]), unit = match[2]
      const rem = unit === 'rem' ? value : value / previewRootPixels
      return [{ key: name.slice(2), value: `${value}${unit}`, unit, px: rem * previewRootPixels, rem }]
    }).sort((a, b) => a.px - b.px)
  }
  return getThemeVariables(namespace).flatMap((variable) => {
    const rem = getNumericRemValue(variable)
    if (rem === undefined || variable.value === undefined) return []
    return [{
      key: variable.key,
      value: String(variable.value),
      ...(getNumericUnit(variable) ? { unit: getNumericUnit(variable) } : {}),
      px: rem * previewRootPixels,
      rem
    }]
  })
}
