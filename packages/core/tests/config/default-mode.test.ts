import { test, expect } from 'vitest'
import { Config, MasterCSS } from '../../src'

test.concurrent('default mode', () => {
    expect(new MasterCSS().add('bg:invert').text).toContain('.light,:root{--invert:0 0 0}')
    expect(new MasterCSS().add('bg:invert').text).toContain('.dark{--invert:255 255 255}')
})

test.concurrent('default mode with host modes', () => {
    const config = { modeTrigger: 'host' } as Config
    expect(new MasterCSS(config).add('bg:invert').text).toContain(':host(.light),:host{--invert:0 0 0}')
    expect(new MasterCSS(config).add('bg:invert').text).toContain(':host(.dark){--invert:255 255 255}')
})
