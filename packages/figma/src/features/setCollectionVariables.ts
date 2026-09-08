import parseColorValue from '../utils/parse-color-value'
import getVariableCollections from './getVariableCollections'
import variableImportData from '../utils/variable-import-data'
import type { VariableData } from '../types/variable-data'

export interface SetCollectionVariablesOptions {
  varCollId?: string
  newVarCollName: string
  variableData: VariableData
}

function literalType(value: string | number | boolean): VariableResolvedDataType {
  if (typeof value === 'number') return 'FLOAT'
  if (typeof value === 'boolean') return 'BOOLEAN'
  try {
    parseColorValue(value)
    return 'COLOR'
  } catch {
    return 'STRING'
  }
}

function cssName(name: string) {
  return name.toLocaleLowerCase().replace(/ /g, '-').replace(/\//g, '-')
}

export default async function setCollectionVariables(options: SetCollectionVariablesOptions) {
  const plan = variableImportData(options.variableData)
  if (!plan.entries.length && !plan.modes.length) throw new Error('No variables or modes found in variable data')
  let collection = options.varCollId
    ? await figma.variables.getVariableCollectionByIdAsync(options.varCollId)
    : (await figma.variables.getLocalVariableCollectionsAsync()).find(c => c.name === options.newVarCollName)
  if (options.varCollId && !collection) throw new Error('Variable collection not found')
  const existingVariables = await figma.variables.getLocalVariablesAsync()
  const variables = new Map(existingVariables
    .filter(v => v.variableCollectionId === collection?.id)
    .map(v => [v.name, v]))
  const entriesByName = new Map<string, typeof plan.entries>()
  for (const entry of plan.entries) {
    const entries = entriesByName.get(entry.name) ?? []
    entries.push(entry)
    entriesByName.set(entry.name, entries)
  }
  const names = new Set([...variables.keys(), ...entriesByName.keys()])
  const aliasTarget = (value: string | number | boolean) => {
    if (typeof value !== 'string') return
    const match = /^var\(--([^()]+)\)$/.exec(value.trim())
    if (!match) {
      if (value.startsWith('$') || value.trim().startsWith('var(')) {
        throw new Error(`Unsupported Figma variable alias: ${value}`)
      }
      return
    }
    const targets = [...names].filter(name => cssName(name) === match[1])
    if (targets.length !== 1) throw new Error(`Missing or ambiguous Figma variable alias: ${value}`)
    return targets[0]
  }
  const types = new Map<string, VariableResolvedDataType>()
  // Literal values anchor the type even when aliases point in opposite
  // directions in different modes (which is not a per-mode alias cycle).
  for (const name of names) {
    let type = variables.get(name)?.resolvedType
    for (const { value } of entriesByName.get(name) ?? []) {
      if (aliasTarget(value)) continue
      const next = literalType(value)
      if (type && type !== next) throw new Error(`Variable type mismatch for "${name}": ${type} and ${next}`)
      type = next
    }
    if (type) types.set(name, type)
  }
  const visiting = new Set<string>()
  const typeFor = (name: string): VariableResolvedDataType => {
    const cached = types.get(name)
    if (cached) return cached
    if (visiting.has(name)) throw new Error(`Circular Figma variable alias: ${name}`)
    visiting.add(name)
    const existing = variables.get(name)?.resolvedType
    let type = existing
    for (const { value } of entriesByName.get(name) ?? []) {
      const target = aliasTarget(value)
      const next = target ? typeFor(target) : literalType(value)
      if (type && type !== next) throw new Error(`Variable type mismatch for "${name}": ${type} and ${next}`)
      type = next
    }
    visiting.delete(name)
    if (!type) throw new Error(`Cannot determine variable type: ${name}`)
    types.set(name, type)
    return type
  }
  // Validate every mode, type and alias before creating or changing Figma data.
  for (const [name, entries] of entriesByName) {
    for (const { value } of entries) {
      const target = aliasTarget(value)
      if (target && typeFor(target) !== typeFor(name)) throw new Error(`Variable type mismatch for "${name}"`)
    }
    typeFor(name)
  }
  for (const mode of plan.modes) {
    const visited = new Set<string>()
    const active = new Set<string>()
    const check = (name: string) => {
      if (active.has(name)) throw new Error(`Circular Figma variable alias: ${name} in ${mode}`)
      if (visited.has(name)) return
      active.add(name)
      const entries = entriesByName.get(name) ?? []
      const modeEntry = [...entries].reverse().find(entry => entry.mode.toLowerCase() === mode.toLowerCase())
      const defaultEntry = [...entries].reverse().find(entry => entry.mode.toLowerCase() === 'default')
      const modeId = collection?.modes.find(item => item.name.toLowerCase() === mode.toLowerCase())?.modeId
      const values = variables.get(name)?.valuesByMode
      const value = modeEntry?.value ?? (modeId ? values?.[modeId] : undefined)
        ?? defaultEntry?.value ?? (collection ? values?.[collection.defaultModeId] : undefined)
      const target = typeof value === 'object' && value && 'type' in value && value.type === 'VARIABLE_ALIAS'
        ? existingVariables.find(variable => variable.id === value.id)?.name
        : typeof value === 'string' ? aliasTarget(value) : undefined
      if (target) check(target)
      active.delete(name)
      visited.add(name)
    }
    for (const name of entriesByName.keys()) check(name)
  }
  const createdCollection = !collection
  collection ??= figma.variables.createVariableCollection(options.newVarCollName)
  const modeIds = new Map(collection.modes.map(mode => [mode.name.toLowerCase(), mode.modeId]))
  modeIds.set('default', collection.defaultModeId)
  for (const mode of plan.modes) {
    if (!modeIds.has(mode.toLowerCase())) modeIds.set(mode.toLowerCase(), collection.addMode(mode))
  }
  for (const name of entriesByName.keys()) {
    if (!variables.has(name)) variables.set(name, figma.variables.createVariable(name, collection, typeFor(name)))
  }
  for (const { name, mode, value } of plan.entries) {
    const variable = variables.get(name)!
    const target = aliasTarget(value)
    const figmaValue = target
      ? { type: 'VARIABLE_ALIAS' as const, id: variables.get(target)!.id }
      : typeFor(name) === 'COLOR' ? parseColorValue(value as string) : value
    variable.setValueForMode(modeIds.get(mode.toLowerCase())!, figmaValue)
  }
  if (createdCollection) {
    figma.ui.postMessage({ type: 'getVariableCollections', data: await getVariableCollections() }, { origin: '*' })
  }
}
