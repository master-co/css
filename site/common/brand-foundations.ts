import { getThemeNumericVariableEntries, getThemeVariables } from '../utils/theme-variables'

/** A curated site selection, read from the public preset rather than copied values. */
export function brandPalette() {
  const colors = getThemeVariables('color')
  return ['amber-40', 'amber-60', 'zinc-0', 'zinc-5', 'zinc-10', 'zinc-20', 'zinc-40', 'zinc-60', 'zinc-80', 'zinc-90', 'zinc-95', 'zinc-100'].map(key => {
    const color = colors.find(entry => entry.key === key)
    if (!color) throw new Error(`Missing brand palette token: ${key}`)
    return { key, token: `--color-${key}`, value: color.value }
  })
}

export function brandScale(namespace: string, keys: string[]) {
  const entries = getThemeNumericVariableEntries(namespace)
  return keys.map(key => {
    const entry = entries.find(value => value.key === key)
    if (!entry) throw new Error(`Missing brand ${namespace} token: ${key}`)
    return { ...entry, token: `--${namespace}-${key}` }
  })
}

export function brandTiming() {
  return getThemeVariables('duration').filter(entry => ['fast', 'normal', 'slow'].includes(entry.key))
    .map(entry => ({ token: `--duration-${entry.key}`, value: entry.value }))
}
