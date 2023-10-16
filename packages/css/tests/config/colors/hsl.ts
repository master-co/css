import MasterCSS from '../../../src'
import { testCSS } from '../../css'

// color functions 使用該格式 "hsl(0deg 0% 0%/.5)".match(/([a-zA-Z]+)\((.*?)\)/) 提取 space 及 value
// -> ['hsl(0deg 0% 0%/.5)', 'hsl', '0deg 0% 0%/.5', index: 0, input: 'hsl(0deg 0% 0%/.5)', groups: undefined]

/**
 * 1. hsl(0deg 0% 0%)
 * 2. { space: 'hsl', value: '0deg 0% 0%/.5' }
 * 3. --primary: 0deg 0% 0%/.5
 */
test('hsl()', () => {
    testCSS('fg:primary', '.fg\\:primary{color:hsl(0deg 0% 0%/.5)}', {
        colors: { primary: 'hsl(0deg 0% 0%/.5)' }
    })
})

test('color/opacity to hsl(h s l/opacity)', () => {
    testCSS('fg:primary/.5', '.fg\\:primary{color:hsl(0deg 0% 0%/.5)}', {
        colors: { primary: 'hsl(0deg 0% 0%/.5)' }
    })
})

describe('with themes', () => {
    const config = {
        colors: {
            primary: {
                '': 'hsl(0deg 0% 0%)',
                '@dark': 'hsl(0deg 0% 100%)',
                '@light': 'hsl(0deg 0% 58.82%)',
                '@chrisma': 'hsl(0deg 0% 0%)/.5'
            }
        }
    }

    it('checks resolved colors', () => {
        const css = new MasterCSS(config)
        expect(css.colors.primary).toBe({
            primary: {
                '': { space: 'hsl', value: '0deg 0% 0%' },
                dark: { space: 'hsl', value: '0deg 0% 100%' },
                light: { space: 'hsl', value: '0deg 0% 58.82%' },
                chrisma: { space: 'hsl', value: '0deg 0% 0%/.5' }
            }
        })
    })

    it('color', () => {
        testCSS('fg:primary', [
            ':root{--primary:0deg 0% 0%}',
            '.dark{--primary:0deg 0% 100%}',
            '.light{--primary:0deg 0% 58.82%}',
            '.chrisma{--primary:0deg 0% 0%/.5}',
            '.fg\\:primary{color:hsl(var(--primary))}'
        ].join(''), config)
    })

    it('color/.5', () => {
        testCSS('fg:primary', [
            ':root{--primary:0deg 0% 0%}',
            '.dark{--primary:0deg 0% 100%}',
            '.light{--primary:0deg 0% 58.82%}',
            '.chrisma{--primary:0deg 0% 0%/.5}', // It does not work in this case `fg:primary`.
            '.fg\\:primary\\/\\.5{color:hsl(var(--primary)/.5)}'
        ].join(''), config)
    })
})