import { it, test, expect } from 'vitest'
import { expectLayers } from './test'

it.concurrent('class to string', () => {
    expectLayers(
        {
            utilities: '.font\\:32{font-size:2rem}.text\\:center{text-align:center}'
        },
        ['text:center', 'font:32']
    )
})
