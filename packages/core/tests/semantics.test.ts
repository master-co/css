import { it, test, expect } from 'vitest'
import { createCSS } from '../src'
import config from './config'
import { expectLayers } from './test'

test.concurrent('utilities', () => {
    expect(createCSS(config).create('show')?.text).toBe('.show{display:block}')
    expect(createCSS().create('gradient-text')?.text).toBe('.gradient-text{-webkit-text-fill-color:transparent;-webkit-background-clip:text;background-clip:text}')

    expectLayers(
        {
            animations: '@keyframes rotate{0%{transform:rotate(-360deg)}to{transform:none}}',
            general: '.\\@my-animation{animation:1s linear infinite rotate}'
        },
        '@my-animation',
        {
            utilities: {
                '@my-animation': {
                    animation: '1s linear infinite rotate'
                }
            }
        }
    )

    expect(createCSS(config).create('hide-text')?.text).toBe('.hide-text{font-size:0px}')
    expect(createCSS(config).create('zero')?.text).toBe('.zero{font-size:0px;height:0px}')
    expect(createCSS().create('full')?.text).toBe('.full{width:100%;height:100%}')
})
