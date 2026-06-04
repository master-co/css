import { test, expect } from 'vitest'
import { Config, UtilityType } from '../../src'
import { expectLayers } from '../test'
import createCSSWithTheme from '../helpers/create-css-with-theme'

test.concurrent('media modes', () => {
    const config = { modeTrigger: 'media' } as Config
    expect(createCSSWithTheme(config).add('bg:invert').themeLayer.text).toContain('@media (prefers-color-scheme:light){:root{--color-invert:var(--color-black)}}')
    expect(createCSSWithTheme(config).add('bg:color-invert').themeLayer.text).toContain('@media (prefers-color-scheme:dark){:root{--color-invert:var(--color-white)}}')
})

test('components', () => {
    expectLayers({ components: '.dark .btn\\@dark{display:block}' }, 'btn@dark', {
        utilities: [
            {
                name: 'btn',
                type: UtilityType.Static,
                layer: 'components',
                rules: [{ selector: '&', declarations: { display: 'block' } }]
            }
        ],
        modeTrigger: 'class'
    })
})

test('components can include modes and selectors', () => {
    const css = createCSSWithTheme({
        utilities: [
            {
                name: 'btn',
                type: UtilityType.Static,
                layer: 'components',
                rules: [
                    { selector: '.dark &', declarations: { display: 'block' } },
                    { selector: '&:hover', declarations: { 'font-size': '1rem' } }
                ]
            }
        ],
        modeTrigger: 'class'
    }).add('btn')

    expect(css.componentsLayer.text).toContain('.dark .btn{display:block}')
    expect(css.componentsLayer.text).toContain('.btn:hover{font-size:1rem}')
})
