import { describe, it, expect } from 'vitest'

import './__mocks__/figma'

import getCollectionVariables from '../src/utils/get-collection-variables'

describe('getCollectionVariables', () => {
    it('should return parsed color config', async () => {
        const result = await getCollectionVariables('mock-id')
        expect(result).toEqual({
            gray: {
                '10': '#ffffff',
                '20': {
                    '@dark': '#808080',
                    '': '$(gray-10)'
                }
            }
        })
    })
})
