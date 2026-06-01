import { describe, expect, it } from 'vitest'
import { type ExtendedConfig, minifyExtendedConfig } from '../../src/utils'

describe('minifyExtendedConfig', () => {
    it('should hoist identical variables across all modes', () => {
        const config = {
            variables: [
                { key: 'white', value: '#fff', mode: 'light' },
                { key: 'black', value: '#000', mode: 'light' },
                { key: 'white', value: '#fff', mode: 'dark' },
                { key: 'black', value: '#000', mode: 'dark' },
            ],
            modes: ['light', 'dark']
        } as ExtendedConfig

        expect(minifyExtendedConfig(config)).toEqual({
            variables: [
                { key: 'white', value: '#fff' },
                { key: 'black', value: '#000' },
            ],
            modes: ['light', 'dark']
        })
    })

    it('should retain mode variables if values differ', () => {
        const config = {
            variables: [
                { key: 'gray', value: '#888', mode: 'light' },
                { key: 'gray', value: '#444', mode: 'dark' },
            ],
            modes: ['light', 'dark']
        } as ExtendedConfig

        expect(minifyExtendedConfig(config)).toEqual(config)
    })

    it('should not hoist if any mode is missing the variable', () => {
        const config = {
            variables: [
                { key: 'common', value: 'shared', mode: 'light' },
            ],
            modes: ['light', 'dark']
        } as ExtendedConfig

        expect(minifyExtendedConfig(config)).toEqual(config)
    })

    it('should not overwrite conflicting existing variables', () => {
        const config = {
            variables: [
                { key: 'red', value: 'conflict' },
                { key: 'red', value: 'real', mode: 'light' },
                { key: 'red', value: 'real', mode: 'dark' },
            ],
            modes: ['light', 'dark']
        } as ExtendedConfig

        expect(minifyExtendedConfig(config)).toEqual(config)
    })

    it('should handle empty config gracefully', () => {
        expect(minifyExtendedConfig({})).toEqual({})
    })
})
