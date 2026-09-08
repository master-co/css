import type { VariableData, VariableDataSection } from '../types/variable-data'

export interface VariableImportEntry {
  name: string
  mode: string
  value: string | number | boolean
}

export default function variableImportData(data: VariableData) {
  const entries: VariableImportEntry[] = []
  const modes = new Set<string>()
  const add = (name: string, mode: string, value: unknown) => {
    if ((typeof value === 'number' && !Number.isFinite(value)) || !name || !mode || !['string', 'number', 'boolean'].includes(typeof value)) {
      throw new Error(`Unsupported Figma variable value or name: ${name}`)
    }
    entries.push({ name, mode, value: value as VariableImportEntry['value'] })
    modes.add(mode)
  }
  const section = (value: VariableDataSection | undefined, mode: string) => {
    if (value === undefined) return
    if (Array.isArray(value)) {
      for (const definition of value) {
        if (!definition || typeof definition.key !== 'string' || !definition.key
          || (definition.namespace !== undefined && typeof definition.namespace !== 'string')
          || (definition.mode !== undefined && typeof definition.mode !== 'string')) {
          throw new Error('Invalid variable definition')
        }
        const name = [definition.namespace?.replace(/\./g, '/'), definition.key].filter(Boolean).join('/')
        add(name, definition.mode ?? mode, definition.value)
      }
      return
    }
    const visit = (value: unknown, name: string) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [key, child] of Object.entries(value)) visit(child, [name, key].filter(Boolean).join('/'))
      } else {
        add(name, mode, value)
      }
    }
    visit(value, '')
  }
  section(data.variables, 'default')
  if (Array.isArray(data.modes)) {
    for (const mode of data.modes) {
      if (typeof mode !== 'string' || !mode) throw new Error('Invalid variable mode name')
      modes.add(mode)
    }
  } else {
    for (const [mode, variables] of Object.entries(data.modes ?? {})) {
      modes.add(mode)
      section(variables, mode)
    }
  }
  return { entries, modes: [...modes] }
}
