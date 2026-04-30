import { describe, test, expect } from 'vitest'
import { MasterCSS } from '../src'

describe('issue #356: alpha alias on a variable that itself has @light/@dark modes', () => {
    const buildConfig = () => ({
        variables: {
            color: {
                brand: '#4285f4',
                brandDark: '#3266cc',
                base: {
                    '@light': '$(color-brand)',
                    '@dark': '$(color-brandDark)'
                },
                soft: '$(color-base)/.2',
                softer: '$(color-base)/.15',
                softest: '$(color-base)/.1'
            }
        },
        rules: {
            bg: { match: '^bg:', layer: 'general', declarations: { 'background-color': '$0' } }
        }
    })

    test('constructor does not throw with inline @<mode> keys (regression for original crash)', () => {
        expect(() => new MasterCSS(buildConfig())).not.toThrow()
    })

    test('inline @<mode> keys produce a base variable with light + dark modes', () => {
        const css = new MasterCSS(buildConfig())
        const v = css.variables.get('color-base') as any
        expect(v).toBeDefined()
        expect(v.type).toBe('color')
        expect(v.modes && Object.keys(v.modes).sort()).toEqual(['dark', 'light'])
        expect(v.modes.light?.value).toBeTruthy()
        expect(v.modes.dark?.value).toBeTruthy()
    })

    test('alpha alias /.2 propagates the alpha to every mode of the aliased variable', () => {
        const css = new MasterCSS(buildConfig())
        const v = css.variables.get('color-soft') as any
        expect(v).toBeDefined()
        expect(v.type).toBe('color')
        expect(v.modes?.light?.alpha).toBe(0.2)
        expect(v.modes?.dark?.alpha).toBe(0.2)
    })

    test('chained alpha aliases (.15, .1) keep correct alpha per mode', () => {
        const css = new MasterCSS(buildConfig())
        const softer = css.variables.get('color-softer') as any
        const softest = css.variables.get('color-softest') as any
        expect(softer.modes?.light?.alpha).toBe(0.15)
        expect(softer.modes?.dark?.alpha).toBe(0.15)
        expect(softest.modes?.light?.alpha).toBe(0.1)
        expect(softest.modes?.dark?.alpha).toBe(0.1)
    })
})
