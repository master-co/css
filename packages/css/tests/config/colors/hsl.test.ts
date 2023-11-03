import MasterCSS, { Config } from '../../../src'
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
        variables: { primary: 'hsl(0deg 0% 0%/.5)' }
    })
})

test('color/opacity to hsl(h s l/opacity / opacity) invalid rule', () => {
    testCSS('fg:primary/.5', '.fg\\:primary\\/\\.5{color:hsl(0deg 0% 0%/.5/.5)}', {
        variables: { primary: 'hsl(0deg 0% 0%/.5)' }
    })
})

describe('with themes', () => {
    const config: Config = {
        variables: {
            primary: {
                '': 'hsl(0deg 0% 0%)',
                '@dark': 'hsl(0deg 0% 100%)',
                '@light': 'hsl(0deg 0% 58.82%)',
                '@chrisma': 'hsl(0deg 0% 0%/.5)'
            }
        }
    }

    it('checks resolved colors', () => {
        const css = new MasterCSS(config)
        expect(css.variables.primary).toEqual({
            type: 'color',
            space: 'hsl',
            value: '0deg 0% 0%',
            themes: {
                'dark': { type: 'color', space: 'hsl', value: '0deg 0% 100%' },
                'light': { type: 'color', space: 'hsl', value: '0deg 0% 58.82%' },
                'chrisma': { type: 'color', space: 'hsl', value: '0deg 0% 0%/.5' }
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
        testCSS('fg:primary/.5', [
            ':root{--primary:0deg 0% 0%}',
            '.dark{--primary:0deg 0% 100%}',
            '.light{--primary:0deg 0% 58.82%}',
            '.chrisma{--primary:0deg 0% 0%/.5}',
            '.fg\\:primary\\/\\.5{color:hsl(var(--primary)/.5)}'
        ].join(''), config)
    })
})