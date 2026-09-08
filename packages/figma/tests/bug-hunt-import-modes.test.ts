import { afterEach, expect, test, vi } from 'vitest'
import getCollectionVariables from '../src/features/getCollectionVariables'
import setCollectionVariables from '../src/features/setCollectionVariables'
import type { VariableData } from '../src/types/variable-data'

type Value = string | number | boolean | RGBA | VariableAlias
function host() {
  let counter = 0
  const collection = {
    id: 'target', name: 'Target', defaultModeId: 'base', variableIds: [] as string[],
    modes: [{ modeId: 'base', name: 'Default' }, { modeId: 'dark', name: 'Dark' }],
    addMode: vi.fn((name: string) => {
      const modeId = `mode-${counter++}`
      collection.modes.push({ modeId, name })
      return modeId
    })
  }
  const variables: {
    id: string, name: string, resolvedType: VariableResolvedDataType,
    variableCollectionId: string, valuesByMode: Record<string, Value>,
    setValueForMode: ReturnType<typeof vi.fn>
  }[] = []
  const createVariable = vi.fn((name: string, owner: typeof collection, type: VariableResolvedDataType) => {
    const variable = {
      id: `v-${counter++}`, name, resolvedType: type, variableCollectionId: owner.id,
      valuesByMode: {} as Record<string, Value>,
      setValueForMode: vi.fn((mode: string, value: Value) => {
        expect(owner.modes.some(item => item.modeId === mode)).toBe(true)
        const alias = typeof value === 'object' && 'type' in value ? variables.find(v => v.id === value.id) : undefined
        if (alias) expect(alias.resolvedType).toBe(type)
        variable.valuesByMode[mode] = value
      })
    }
    variables.push(variable)
    owner.variableIds.push(variable.id)
    return variable
  })
  const api = {
    getVariableCollectionByIdAsync: async () => collection,
    getLocalVariableCollectionsAsync: async () => [collection],
    getLocalVariablesAsync: async () => variables,
    getVariableByIdAsync: async (id: string) => variables.find(v => v.id === id),
    createVariable,
    createVariableCollection: vi.fn()
  }
  vi.stubGlobal('figma', { variables: api, notify: vi.fn(), ui: { postMessage: vi.fn() } })
  const apply = (variableData: VariableData) => setCollectionVariables({ varCollId: collection.id, newVarCollName: '', variableData })
  return { collection, variables, api, apply }
}
afterEach(() => vi.unstubAllGlobals())

test('BH-0022 definition arrays preserve namespaces, mode values, forward aliases and booleans', async () => {
  const { apply, variables, collection, api } = host()
  const data: VariableData = {
    variables: [
      { namespace: 'gray', key: 'alias', value: 'var(--gray-base)' },
      { namespace: 'gray', key: 'base', value: '#ffffff' },
      { namespace: 'gray', key: 'base', mode: 'dark', value: '#000000' },
      { namespace: 'space.layout', key: 'base', value: 16 },
      { namespace: 'space.layout', key: 'base', mode: 'dark', value: 20 },
      { key: 'visible', value: false },
      { key: 'visible', value: true, mode: 'dark' }
    ],
    modes: ['dark', 'high-contrast']
  }
  await apply(data)
  expect(variables.map(v => v.name)).toEqual(['gray/alias', 'gray/base', 'space/layout/base', 'visible'])
  expect(collection.addMode).toHaveBeenCalledExactlyOnceWith('high-contrast')
  const base = variables.find(v => v.name === 'gray/base')!
  expect(base.valuesByMode).toEqual({ base: { r: 1, g: 1, b: 1, a: 1 }, dark: { r: 0, g: 0, b: 0, a: 1 } })
  expect(variables.find(v => v.name === 'gray/alias')!.valuesByMode.base).toEqual({ type: 'VARIABLE_ALIAS', id: base.id })
  expect(variables.find(v => v.name === 'space/layout/base')!.valuesByMode).toEqual({ base: 16, dark: 20 })
  expect(variables.find(v => v.name === 'visible')!.valuesByMode).toEqual({ base: false, dark: true })
  await apply(data)
  expect(api.createVariable).toHaveBeenCalledTimes(4)
  expect(collection.addMode).toHaveBeenCalledTimes(1)
  const exported = await getCollectionVariables({ varCollId: collection.id, defaultVarMode: { name: 'Default' } })
  expect(exported?.variables).toEqual(expect.arrayContaining([
    { namespace: 'gray', key: 'alias', value: 'var(--gray-base)' },
    { namespace: 'space.layout', key: 'base', value: 20, mode: 'dark' },
    { key: 'visible', value: false }, { key: 'visible', value: true, mode: 'dark' }
  ]))
  await apply(exported!)
  expect(api.createVariable).toHaveBeenCalledTimes(4)
})

test('BH-0022 legacy objects and object mode sections update existing variables', async () => {
  const { apply, variables } = host()
  await apply({ variables: { space: { base: 8 } }, modes: { dark: { space: { base: 12 } } } })
  await apply({ variables: { space: { base: 16 } }, modes: { DARK: { space: { base: 24 } } } })
  expect(variables).toHaveLength(1)
  expect(variables[0].valuesByMode).toEqual({ base: 16, dark: 24 })
})

test.each([
  { variables: [{ key: 'a', value: 'var(--missing)' }] },
  { variables: [{ key: 'a', value: '$missing' }] },
  { variables: [{ key: 'a', value: ['red', 'blue'] }] },
  { variables: [{ key: 'a', value: 'var(--b)' }, { key: 'b', value: 'var(--a)' }] },
  { variables: [{ namespace: 'a', key: 'b', value: 1 }, { key: 'a-b', value: 2 }, { key: 'alias', value: 'var(--a-b)' }] }
] satisfies VariableData[])('BH-0022 rejects unsupported/ambiguous data before Figma mutation: %j', async data => {
  const { apply, variables, collection, api } = host()
  await expect(apply(data)).rejects.toThrow()
  expect(variables).toHaveLength(0)
  expect(api.createVariable).not.toHaveBeenCalled()
  expect(collection.addMode).not.toHaveBeenCalled()
})

test('BH-0022 incompatible existing types preserve the variable and its values', async () => {
  const { apply, variables, api } = host()
  await apply({ variables: { base: 16 } })
  const variable = variables[0]
  await expect(apply({ variables: { added: 10, base: '#ffffff' } })).rejects.toThrow('Variable type mismatch')
  expect(variables).toEqual([variable])
  expect(variable.valuesByMode).toEqual({ base: 16 })
  expect(api.createVariable).toHaveBeenCalledTimes(1)
})

test('BH-0022 opposite alias directions in different modes are not a cycle', async () => {
  const { apply, variables } = host()
  await apply({ variables: [
    { key: 'a', value: 'var(--b)' }, { key: 'b', value: 16 },
    { key: 'a', value: 24, mode: 'dark' }, { key: 'b', value: 'var(--a)', mode: 'dark' }
  ] })
  expect(variables.map(v => v.resolvedType)).toEqual(['FLOAT', 'FLOAT'])
})

test('BH-0022 rejects same-mode cycles even when types are already known', async () => {
  const { apply, variables } = host()
  await apply({ variables: { a: 16, b: 24 } })
  await expect(apply({ variables: { a: 'var(--b)', b: 'var(--a)' } })).rejects.toThrow('Circular Figma variable alias')
  expect(variables.map(v => v.valuesByMode)).toEqual([{ base: 16 }, { base: 24 }])
})
