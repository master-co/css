import { test, expect } from 'vitest'
import { Config, MasterCSS } from '../../src'
import { expectLayers } from '../test'

test.concurrent('modes', () => {
    expectLayers(
        {
            theme: '.dark{--fade:51 51 51}',
            general: '.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block;color:rgb(var(--fade))}'
        },
        '{block;fg:fade}_:where(p)_code:before',
        {
            variables: {
                fade: {
                    '@light': '#cccccc',
                    '@dark': '#333333',
                    '@darker': '#222222'
                }
            },
            modes: { light: false }
        }
    )
})

test.concurrent('media modes', () => {
    const config = { modes: { dark: 'media', light: 'media' } } as Config
    expect(new MasterCSS(config).add('bg:invert').themeLayer.text).toContain('@media (prefers-color-scheme:light){:root{--invert:0 0 0}}')
    expect(new MasterCSS(config).add('bg:invert').themeLayer.text).toContain('@media (prefers-color-scheme:dark){:root{--invert:255 255 255}}')
})

test('components', () => {
    expectLayers({ components: '.dark .btn\\@dark{display:block}' }, 'btn@dark', { components: { btn: 'block' } })
})