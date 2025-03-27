import { test } from 'vitest'
import { expectLayers } from '../test'

test.concurrent('base and preset', async () => {
    expectLayers({ base: '.block\\@base{display:block}' }, 'block@base')
    expectLayers({ preset: '.block\\@preset{display:block}' }, 'block@preset')
})

test.concurrent('with breakpoint ', async () => {
    expectLayers({ base: '@media (width>=52.125rem){.block\\@base\\@sm{display:block}}' }, 'block@base@sm')
    expectLayers({ preset: '@media (width>=52.125rem){.block\\@preset\\@sm{display:block}}' }, 'block@preset@sm')
})

test.concurrent('with selectors', () => {
    expectLayers({ base: '.font\\:12_\\:is\\(code\\,pre\\)\\@base :is(code,pre){font-size:0.75rem}' }, 'font:12_:is(code,pre)@base')
    expectLayers({ preset: '.font\\:12_\\:is\\(code\\,pre\\)\\@preset :is(code,pre){font-size:0.75rem}' }, 'font:12_:is(code,pre)@preset')
})

test.concurrent('using components', async () => {
    expectLayers({ components: '@layer base{.btn{display:block}}' }, 'btn', {
        components: {
            'btn': 'block@base'
        }
    })
})

test.concurrent('conflicts', async () => {
    expectLayers({ general: '@layer base.preset{.block\\@base\\@preset{display:block}}' }, 'block@base@preset')
})
