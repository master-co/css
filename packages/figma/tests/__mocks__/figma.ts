globalThis.figma = {
    variables: {
        getVariableCollectionByIdAsync: async (id: string) => ({
            id,
            modes: [
                { modeId: '1', name: 'Default' },
                { modeId: '2', name: 'Dark' }
            ],
            variableIds: ['v1', 'v2']
        }),
        getVariableByIdAsync: async (id: string) => {
            if (id === 'v1') {
                return {
                    name: 'gray/10',
                    resolvedType: 'COLOR',
                    valuesByMode: {
                        '1': { r: 1, g: 1, b: 1, a: 1 },
                        '2': { r: 0, g: 0, b: 0, a: 1 }
                    }
                }
            }
            if (id === 'v2') {
                return {
                    name: 'gray/20',
                    resolvedType: 'COLOR',
                    valuesByMode: {
                        '1': { type: 'VARIABLE_ALIAS', id: 'v1' },
                        '2': { r: 0.5, g: 0.5, b: 0.5, a: 1 }
                    }
                }
            }
            return null
        }
    }
} as any
