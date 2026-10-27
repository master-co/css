import { expect, it, vi } from 'vitest'
import getCollectionVariables from '../src/features/getCollectionVariables'
import setCollectionVariables from '../src/features/setCollectionVariables'

// BH-0022: import the public export format without turning metadata into variables.
it.each([false, true])('imports variable names with exportedDefinitions=%s', async (exportedDefinitions) => {
    const collection = { id: 'collection', defaultModeId: 'default',
        modes: [{ modeId: 'default', name: 'Default' }], variableIds: ['one'], addMode: vi.fn(() => 'extra') }
    const created: string[] = []
    vi.stubGlobal('figma', {
        notify: vi.fn(), ui: { postMessage: vi.fn() },
        variables: {
            getVariableCollectionByIdAsync: async () => collection,
            getVariableByIdAsync: async () => ({ name: 'space/base', resolvedType: 'FLOAT', valuesByMode: { default: 16 } }),
            getLocalVariablesAsync: async () => [],
            createVariable: (name: string) => { created.push(name); return { setValueForMode: vi.fn() } }
        }
    })
    try {
        const data = exportedDefinitions
            ? await getCollectionVariables({ varCollId: collection.id, defaultVarMode: { name: 'Default' } })
            : { variables: { space: { base: 16 } } }
        await setCollectionVariables({ varCollId: collection.id, newVarCollName: '', variableData: data! })
        expect(created).toEqual(['space/base'])
    } finally {
        vi.unstubAllGlobals()
    }
})
