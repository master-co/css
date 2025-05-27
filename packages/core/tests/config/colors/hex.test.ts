import { it, test, expect, describe } from 'vitest'
import { createCSS } from '../../../src'
import { Config } from '../../../src'
import { expectLayers } from '../../test'

/**
 * 1. 000000
 * 2. { space: 'rgb', value: '0 0 0' }
 * 3. --primary: 0 0 0
 */
test.concurrent('#hex to rgb()', () => {
    expect(createCSS({
        variables: { primary: '#000000' }
    }).create('fg:primary')?.text).toBe('.fg\\:primary{color:rgb(0 0 0)}')
})

test.concurrent('color/opacity to rgb(r g b/opacity)', () => {
    expect(createCSS({
        variables: { primary: '#000000' }
    }).create('fg:primary/.5')?.text).toBe('.fg\\:primary\\/\\.5{color:rgb(0 0 0/0.5)}')
})

describe.concurrent('with themes', () => {
    const config: Config = {
        variables: {
            primary: '#000000'
        },
        modes: {
            light: {
                primary: '#969696'
            },
            dark: {
                primary: '#ffffff'
            },
            chrisma: {
                primary: '$color-black/.5'
            }
        },
        modeTrigger: 'class'
    }

    it.concurrent('checks resolved colors', () => {
        const css = createCSS(config)
        expect(css.variables.get('primary')).toEqual({
            name: 'primary',
            key: 'primary',
            type: 'color',
            space: 'rgb',
            value: '0 0 0',
            modes: {
                'dark': { space: 'rgb', value: '255 255 255' },
                'light': { space: 'rgb', value: '150 150 150' },
                'chrisma': { space: 'oklch', value: '0% 0 none', alpha: .5 }
            }
        })
    })

    it.concurrent('color', () => {
        expectLayers(
            {
                theme: ':root{--primary:rgb(0 0 0)}.light{--primary:rgb(150 150 150)}.dark{--primary:rgb(255 255 255)}.chrisma{--primary:oklch(0% 0 none/0.5)}',
                general: '.fg\\:primary{color:var(--primary)}'
            },
            'fg:primary',
            config
        )
    })

    it.concurrent('color/.5', () => {
        expectLayers(
            {
                theme: ':root{--primary:rgb(0 0 0)}.light{--primary:rgb(150 150 150)}.dark{--primary:rgb(255 255 255)}.chrisma{--primary:oklch(0% 0 none/0.5)}',
                general: '.fg\\:primary\\/\\.5{color:color-mix(in oklab,var(--primary) 50%,transparent)}'
            },
            'fg:primary/.5',
            config
        )
    })
})