import { it, test, expect, describe } from 'vitest'
import { Config } from '../../../src'
import { expectLayers } from '../../test'
import createCSSWithTheme from '../../helpers/create-css-with-theme'

test.concurrent('hsl()', () => {
    expect(createCSSWithTheme({ variables: [{ key: 'primary', value: 'hsl(0deg 0% 0%/0.5)' }], modeTrigger: 'class' }).create('fg:primary')?.text
    ).toBe('.fg\\:primary{color:var(--primary)}')
})

test.concurrent('color/opacity to hsl(h s l/opacity / opacity) invalid rule', () => {
    expect(createCSSWithTheme({ variables: [{ key: 'primary', value: 'hsl(0deg 0% 0%/.5)' }] }).create('fg:primary/.5')?.text
    ).toBe('.fg\\:primary\\/\\.5{color:color-mix(in oklab,var(--primary) 50%,transparent)}')
})

describe.concurrent('with themes', () => {
    const config: Config = { variables: [{ key: 'primary', value: 'hsl(0deg 0% 0%)' }, { key: 'primary', value: 'hsl(0deg 0% 58.82%)', mode: 'light' }, { key: 'primary', value: 'hsl(0deg 0% 100%)', mode: 'dark' }, { key: 'primary', value: 'hsl(0deg 0% 0%/.5)', mode: 'chrisma' }], modes: ['light', 'dark', 'chrisma'], modeTrigger: 'class' }

    it.concurrent('checks resolved colors', () => {
        const css = createCSSWithTheme(config)
        expect(css.variables.get('primary')).toEqual({
            name: 'primary',
            key: 'primary',
            type: 'string',
            value: 'hsl(0deg 0% 0%)',
            modes: {
                dark: { type: 'string', value: 'hsl(0deg 0% 100%)' },
                light: { type: 'string', value: 'hsl(0deg 0% 58.82%)' },
                chrisma: { type: 'string', value: 'hsl(0deg 0% 0%/.5)' },
            }
        })
    })

    it.concurrent('color/.5', () => {
        expectLayers(
            {
                theme: ':root{--primary:hsl(0deg 0% 0%)}.light{--primary:hsl(0deg 0% 58.82%)}.dark{--primary:hsl(0deg 0% 100%)}.chrisma{--primary:hsl(0deg 0% 0%/.5)}',
                utilities: '.fg\\:primary\\/\\.5{color:color-mix(in oklab,var(--primary) 50%,transparent)}'
            },
            'fg:primary/.5',
            config
        )
    })
})
