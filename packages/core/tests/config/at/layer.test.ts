import { test } from 'vitest'
import { expectLayers } from '../../test'

test.concurrent('layer', () => {
    expectLayers({ components: '@layer preset{.btn{display:block}}' }, 'btn', {
        components: {
            btn: 'block@preset'
        }
    })

    expectLayers({ components: '@layer base{.btn{display:block}}' }, 'btn', {
        components: {
            btn: 'block@base'
        }
    })
})