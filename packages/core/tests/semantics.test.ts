import { it, test, expect } from 'vitest'
import config from './config'
import { expectLayers } from './test'
import createCSSWithTheme from './helpers/create-css-with-theme'

test.concurrent('utilities', () => {
    expect(createCSSWithTheme(config).create('show')?.text).toBe('.show{display:block}')
    expect(createCSSWithTheme().create('gradient-text')?.text).toBe('.gradient-text{-webkit-text-fill-color:transparent;background-clip:text}')

    expectLayers(
        {
            animations: '@keyframes rotate{0%{transform:rotate(-360deg)}to{transform:none}}',
            utilities: '.\\@my-animation{animation:1s linear infinite rotate}'
        },
        '@my-animation',
        { utilities: [{ name: '@my-animation', type: -4, declarations: {
                    animation: '1s linear infinite rotate'
                } }] }
    )

    expect(createCSSWithTheme(config).create('hide-text')?.text).toBe('.hide-text{font-size:0px}')
    expect(createCSSWithTheme(config).create('zero')?.text).toBe('.zero{font-size:0px;height:0px}')
    expect(createCSSWithTheme().create('full')?.text).toBe('.full{width:100%;height:100%}')
})
