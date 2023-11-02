import MasterCSS from '../../../src'
import { testCSS } from '../../css'

/**
 * 1. 000000
 * 2. { space: 'rgb', value: '0 0 0' }
 * 3. --primary: 0 0 0
 */
test('#hex to rgb()', () => {
    testCSS('fg:primary', '.fg\\:primary{color:rgb(0 0 0)}', {
        variables: { primary: '#000000' }
    })
})

test('color/opacity to rgb(r g b/opacity)', () => {
    testCSS('fg:primary/.5', '.fg\\:primary\\/\\.5{color:rgb(0 0 0/.5)}', {
        variables: { primary: '#000000' }
    })
})

describe('with themes', () => {
    const config = {
        variables: {
            primary: {
                '': '#000000',
                '@dark': '#ffffff',
                '@light': '#969696',
                '@chrisma': '$(black)/.5'
            }
        }
    }

    it('checks resolved colors', () => {
        const css = new MasterCSS(config)
        expect(css.colorVariables.primary).toEqual({
            '': { type: 'color', space: 'rgb', value: '0 0 0' },
            '@dark': { type: 'color', space: 'rgb', value: '255 255 255' },
            '@light': { type: 'color', space: 'rgb', value: '150 150 150' },
            '@chrisma': { type: 'color', space: 'rgb', value: '0 0 0 / .5' }
        })
    })

    it('color', () => {
        testCSS('fg:primary', [
            ':root{--primary:0 0 0}',
            '.dark{--primary:255 255 255}',
            '.light{--primary:150 150 150}',
            '.chrisma{--primary:0 0 0 / .5}',
            '.fg\\:primary{color:rgb(var(--primary))}'
        ].join(''), config)
    })

    it('color/.5', () => {
        testCSS('fg:primary/.5', [
            ':root{--primary:0 0 0}',
            '.dark{--primary:255 255 255}',
            '.light{--primary:150 150 150}',
            '.chrisma{--primary:0 0 0 / .5}', // It does not work in this case `fg:primary`.
            '.fg\\:primary\\/\\.5{color:rgb(var(--primary)/.5)}'
        ].join(''), config)
    })
})