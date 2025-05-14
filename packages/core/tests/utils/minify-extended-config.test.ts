
import { describe, it, expect } from 'vitest'
import { ExtendedConfig, minifyExtendedConfig } from '../../src'

describe('minifyExtendedConfig', () => {
    it('should hoist identical variables across all modes', () => {
        const config = {
            variables: {},
            modes: {
                light: {
                    white: { name: 'white', key: 'white', value: '#fff' },
                    black: { name: 'black', key: 'black', value: '#000' },
                },
                dark: {
                    white: { name: 'white', key: 'white', value: '#fff' },
                    black: { name: 'black', key: 'black', value: '#000' },
                },
            },
        } as unknown as ExtendedConfig

        expect(minifyExtendedConfig(config)).toEqual({
            variables: {
                white: { name: 'white', key: 'white', value: '#fff' },
                black: { name: 'black', key: 'black', value: '#000' },
            },
        })
    })

    it('should retain mode variables if values differ', () => {
        const config = {
            variables: {},
            modes: {
                light: {
                    gray: { name: 'gray', key: 'gray', value: '#888' },
                },
                dark: {
                    gray: { name: 'gray', key: 'gray', value: '#444' },
                },
            },
        } as unknown as ExtendedConfig

        expect(minifyExtendedConfig(config)).toEqual({
            modes: {
                light: {
                    gray: { name: 'gray', key: 'gray', value: '#888' },
                },
                dark: {
                    gray: { name: 'gray', key: 'gray', value: '#444' },
                },
            },
        })
    })

    it('should not hoist if any mode is missing the variable', () => {
        const config = {
            modes: {
                light: {
                    common: { name: 'common', key: 'common', value: 'shared' },
                },
                dark: {},
            },
        } as unknown as ExtendedConfig

        expect(minifyExtendedConfig(config)).toEqual({
            modes: {
                light: {
                    common: { name: 'common', key: 'common', value: 'shared' },
                },
                dark: {},
            },
        })
    })

    it('should not overwrite conflicting existing variables', () => {
        const config = {
            variables: {
                red: { name: 'red', key: 'red', value: 'conflict' },
            },
            modes: {
                light: {
                    red: { name: 'red', key: 'red', value: 'real' },
                },
                dark: {
                    red: { name: 'red', key: 'red', value: 'real' },
                },
            },
        } as unknown as ExtendedConfig

        expect(minifyExtendedConfig(config)).toEqual({
            variables: {
                red: { name: 'red', key: 'red', value: 'conflict' },
            },
            modes: {
                light: {
                    red: { name: 'red', key: 'red', value: 'real' },
                },
                dark: {
                    red: { name: 'red', key: 'red', value: 'real' },
                },
            },
        })
    })

    it('should handle empty config gracefully', () => {
        expect(minifyExtendedConfig({})).toEqual({})
    })
})
