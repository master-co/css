import { test, expect } from 'vitest'
import { Config, MasterCSS } from '../../src'
import { expectLayers } from '../test'

test.concurrent('media modes', () => {
    const config = { modeTrigger: 'media' } as Config
    expect(new MasterCSS(config).add('bg:invert').themeLayer.text).toContain('@media (prefers-color-scheme:light){:root{--invert:0 0 0}}')
    expect(new MasterCSS(config).add('bg:invert').themeLayer.text).toContain('@media (prefers-color-scheme:dark){:root{--invert:255 255 255}}')
})

test('components', () => {
    expectLayers({ components: '.dark .btn\\@dark{display:block}' }, 'btn@dark', { components: { btn: 'block' }, modeTrigger: 'class' })
})