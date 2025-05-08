import { test, expect } from 'vitest'
import { Config, createCSS } from '../../src'

test.concurrent('default mode', () => {
    expect(createCSS({ modeTrigger: 'class' }).add('bg:invert').text).toContain('.light,:root{--invert:0 0 0}')
    expect(createCSS({ modeTrigger: 'class' }).add('bg:invert').text).toContain('.dark{--invert:255 255 255}')
})

// test.concurrent('default mode with host modes', () => {
//     const config = { modeTrigger: 'host' } as Config
//     expect(createCSS(config).add('bg:invert').text).toContain(':host(.light),:host{--invert:0 0 0}')
//     expect(createCSS(config).add('bg:invert').text).toContain(':host(.dark){--invert:255 255 255}')
// })
