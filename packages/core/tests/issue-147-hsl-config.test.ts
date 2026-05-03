import { describe, test, expect } from 'vitest'
import { MasterCSS } from '../src'

describe('issue #147: config.colors should accept hsl() values', () => {
    test('hsl() string in variables.color resolves and renders', () => {
        const css = new MasterCSS({
            variables: {
                color: { primary: 'hsl(210 100% 50%)' }
            }
        })
        const v = css.variables.get('color-primary') as any
        expect(v).toBeDefined()
        expect(v.type).toBe('color')
        expect(v.space).toBe('hsl')
    })

    test('hsl() with alpha works', () => {
        const css = new MasterCSS({
            variables: {
                color: { primary: 'hsl(210 100% 50% / 0.5)' }
            }
        })
        const v = css.variables.get('color-primary') as any
        expect(v).toBeDefined()
        expect(v.type).toBe('color')
        expect(v.space).toBe('hsl')
        expect(v.alpha).toBe(0.5)
    })

    test('hsl() in nested color group', () => {
        const css = new MasterCSS({
            variables: {
                color: {
                    brand: {
                        primary: 'hsl(210 100% 50%)',
                        secondary: 'hsl(290 80% 40%)'
                    }
                }
            }
        })
        expect((css.variables.get('color-brand-primary') as any)?.space).toBe('hsl')
        expect((css.variables.get('color-brand-secondary') as any)?.space).toBe('hsl')
    })

    test('legacy comma-separated hsl() also works', () => {
        const css = new MasterCSS({
            variables: {
                color: { primary: 'hsl(210, 100%, 50%)' }
            }
        })
        const v = css.variables.get('color-primary') as any
        expect(v).toBeDefined()
        expect(v.type).toBe('color')
        expect(v.space).toBe('hsl')
    })
})
