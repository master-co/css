import { expect, test } from 'vitest'
import { UtilityType } from '../../src'
import { expectLayers } from '../test'
import createCSSWithTheme from '../helpers/create-css-with-theme'

test.concurrent('base and defaults', async () => {
    expectLayers({ base: '.block\\@base{display:block}' }, 'block@base')
    expectLayers({ defaults: '.block\\@default{display:block}' }, 'block@default')
    expectLayers({ components: '.block\\@component{display:block}' }, 'block@component')
    expectLayers({ utilities: '.block\\@utility{display:block}' }, 'block@utility')
})

test.concurrent('with breakpoint ', async () => {
    expectLayers({ base: '@media (width>=52.125rem){.block\\@base\\@sm{display:block}}' }, 'block@base@sm')
    expectLayers({ defaults: '@media (width>=52.125rem){.block\\@default\\@sm{display:block}}' }, 'block@default@sm')
})

test.concurrent('with selectors', () => {
    expectLayers({ base: '.font\\:12_\\:is\\(code\\,pre\\)\\@base :is(code,pre){font-size:0.75rem}' }, 'font:12_:is(code,pre)@base')
    expectLayers({ defaults: '.font\\:12_\\:is\\(code\\,pre\\)\\@default :is(code,pre){font-size:0.75rem}' }, 'font:12_:is(code,pre)@default')
})

test.concurrent('using components', async () => {
    const css = createCSSWithTheme({
        utilities: [
            {
                name: 'btn',
                type: UtilityType.Static,
                layer: 'components',
                rules: [
                    { selector: '&', atRules: ['@layer base'], declarations: { display: 'block' } }
                ]
            }
        ]
    }).add('btn')
    expect(css.componentsLayer.text).toContain('@layer base{.btn{display:block}}')
})

test.concurrent('conflicts', async () => {
    expectLayers({ base: '@layer defaults{.block\\@base\\@default{display:block}}' }, 'block@base@default')
})
