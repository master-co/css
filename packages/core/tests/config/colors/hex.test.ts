import { it, test, expect, describe } from 'vitest'
import { Config } from '../../../src'
import { expectLayers } from '../../test'
import createCSSWithTheme from '../../helpers/create-css-with-theme'

test.concurrent('#hex to rgb()', () => {
    expect(createCSSWithTheme({ variables: [{ key: 'primary', value: '#000000' }] }).create('fg:primary')?.text).toBe('.fg\\:primary{color:var(--primary)}')
})

test.concurrent('color/opacity to rgb(r g b/opacity)', () => {
    expect(createCSSWithTheme({ variables: [{ key: 'primary', value: '#000000' }] }).create('fg:primary/.5')?.text).toBe('.fg\\:primary\\/\\.5{color:color-mix(in oklab,var(--primary) 50%,transparent)}')
})

describe.concurrent('with themes', () => {
    const config: Config = { variables: [{ key: 'primary', value: '#000000' }, { key: 'primary', value: '#969696', mode: 'light' }, { key: 'primary', value: '#ffffff', mode: 'dark' }, { key: 'primary', value: '$color-black/.5', mode: 'chrisma' }], modes: ['light', 'dark', 'chrisma'], modeTrigger: 'class' }

    it.concurrent('checks resolved colors', () => {
        const css = createCSSWithTheme(config)
        expect(css.variables.get('primary')).toEqual({
            name: 'primary',
            key: 'primary',
            type: 'string',
            value: '#000000',
            dependencies: new Set(['color-black']),
            modes: {
                dark: { type: 'string', value: '#ffffff' },
                light: { type: 'string', value: '#969696' },
                chrisma: { type: 'string', value: '$color-black/.5' },
            }
        })
    })

    it.concurrent('color', () => {
        expectLayers(
            {
                theme: ':root{--primary:#000000;--color-black:oklch(0% 0 none)}.light{--primary:#969696}.dark{--primary:#ffffff}.chrisma{--primary:color-mix(in oklab,var(--color-black) 50%,transparent)}',
                utilities: '.fg\\:primary{color:var(--primary)}'
            },
            'fg:primary',
            config
        )
    })

    it.concurrent('color/.5', () => {
        expectLayers(
            {
                theme: ':root{--primary:#000000;--color-black:oklch(0% 0 none)}.light{--primary:#969696}.dark{--primary:#ffffff}.chrisma{--primary:color-mix(in oklab,var(--color-black) 50%,transparent)}',
                utilities: '.fg\\:primary\\/\\.5{color:color-mix(in oklab,var(--primary) 50%,transparent)}'
            },
            'fg:primary/.5',
            config
        )
    })
})
