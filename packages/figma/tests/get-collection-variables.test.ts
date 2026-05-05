import { describe, it, expect } from 'vitest'

import './__mocks__/figma'

import getCollectionVariables from '../src/features/getCollectionVariables'

describe('getCollectionVariables', () => {
    it('should return parsed color config', async () => {
        const result = await getCollectionVariables({ varCollId: 'mock-id', defaultVarMode: { name: 'Default' } })
        expect(result).toEqual({
            variables: [
                { namespace: 'gray', key: '10', value: '#fff' },
                { namespace: 'gray', key: '20', value: '$gray-10' },
                { namespace: 'gray', key: '10', value: '#000', mode: 'dark' },
                { namespace: 'gray', key: '20', value: '#808080', mode: 'dark' }
            ],
            modes: ['dark']
        })
    })
})
