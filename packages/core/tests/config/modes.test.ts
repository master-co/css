import { test, expect } from 'vitest'
import { Config, createCSS, UtilityType } from '../../src'
import { expectLayers } from '../test'

test.concurrent('media modes', () => {
    const config = { modeTrigger: 'media' } as Config
    expect(createCSS(config).add('bg:invert').themeLayer.text).toContain('@media (prefers-color-scheme:light){:root{--color-invert:var(--color-black)}}')
    expect(createCSS(config).add('bg:color-invert').themeLayer.text).toContain('@media (prefers-color-scheme:dark){:root{--color-invert:var(--color-white)}}')
})

test('components', () => {
    expectLayers({ main: '.dark .btn\\@dark{display:block}' }, 'btn@dark', {
        utilities: [
            {
                name: 'btn',
                type: UtilityType.Static,
                layer: 'main',
                rules: [{ selector: '&', declarations: { display: 'block' } }]
            }
        ],
        modeTrigger: 'class'
    })
})

test('components can include modes and selectors', () => {
    const css = createCSS({
        utilities: [
            {
                name: 'btn',
                type: UtilityType.Static,
                layer: 'main',
                rules: [
                    { selector: '.dark &', declarations: { display: 'block' } },
                    { selector: '&:hover', declarations: { 'font-size': '1rem' } }
                ]
            }
        ],
        modeTrigger: 'class'
    }).add('btn')

    expect(css.mainLayer.text).toContain('.dark .btn{display:block}')
    expect(css.mainLayer.text).toContain('.btn:hover{font-size:1rem}')
})
