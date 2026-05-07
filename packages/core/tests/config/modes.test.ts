import { test, expect } from 'vitest'
import { Config, createCSS } from '../../src'
import { expectLayers } from '../test'

test.concurrent('media modes', () => {
    const config = { modeTrigger: 'media' } as Config
    expect(createCSS(config).add('bg:invert').themeLayer.text).toContain('@media (prefers-color-scheme:light){:root{--color-invert:oklch(0% 0 none)}}')
    expect(createCSS(config).add('bg:color-invert').themeLayer.text).toContain('@media (prefers-color-scheme:dark){:root{--color-invert:oklch(100% 0 none)}}')
})

test('components', () => {
    expectLayers({ components: '.dark .btn\\@dark{display:block}' }, 'btn@dark', { components: { btn: [
        { selector: '&', declarations: { display: 'block' } }
    ] }, modeTrigger: 'class' })
})

test('components can include modes and selectors', () => {
    const css = createCSS({ components: { btn: [
        { selector: '.dark &', declarations: { display: 'block' } },
        { selector: '&:hover', declarations: { 'font-size': '1rem' } }
    ] }, modeTrigger: 'class' }).add('btn')

    expect(css.componentsLayer.text).toContain('.dark .btn{display:block}')
    expect(css.componentsLayer.text).toContain('.btn:hover{font-size:1rem}')
})
