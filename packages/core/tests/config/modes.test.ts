import { test, expect } from 'vitest'
import { Config, createCSS } from '../../src'
import { expectLayers } from '../test'

test.concurrent('media modes', () => {
    const config = { modeTrigger: 'media' } as Config
    expect(createCSS(config).add('bg:invert').themeLayer.text).toContain('@media (prefers-color-scheme:light){:root{--invert:oklch(0% 0 none)}}')
    expect(createCSS(config).add('bg:invert').themeLayer.text).toContain('@media (prefers-color-scheme:dark){:root{--invert:oklch(100% 0 none)}}')
})

test('components', () => {
    expectLayers({ components: '.dark .btn\\@dark{display:block}' }, 'btn@dark', { components: { btn: 'block' }, modeTrigger: 'class' })
})