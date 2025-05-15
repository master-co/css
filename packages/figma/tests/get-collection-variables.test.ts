import { describe, it, expect } from 'vitest'

import './__mocks__/figma'

import getCollectionVariables from '../src/features/get-collection-variables'

describe('getCollectionVariables', () => {
    it('should return parsed color config', async () => {
        const result = await getCollectionVariables('mock-id', { defaultMode: { name: 'Default' } })
        expect(result).toEqual({
            variables: {
                gray: {
                    '10': '#fff',
                    '20': '$gray-10'
                }
            },
            modes: {
                dark: {
                    gray: {
                        '10': '#000',
                        '20': '#808080'
                    }
                }
            }
        })
    })
})
