import { it, test, expect, describe } from 'vitest'
import { expectLayers } from '../test'

describe.concurrent('@tve', () => {
    it.concurrent('scope', () => {
        expectLayers(
            {
                general: '.master-css .pt\\:2ex{padding-top:2ex}'
            },
            'pt:2ex',
            { scope: '.master-css', modeTrigger: 'class' }
        )
        expectLayers(
            {
                general: '.dark .master-css .pt\\:2ex\\@dark{padding-top:2ex}'
            },
            'pt:2ex@dark',
            { scope: '.master-css', modeTrigger: 'class' }
        )
    })
})
