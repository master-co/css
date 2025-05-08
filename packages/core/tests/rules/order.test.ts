import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('oreder', () => {
    expect(createCSS().create('order:1')?.declarations).toStrictEqual({ order: '1' })
    expect(createCSS().create('o:1')?.declarations).toStrictEqual({ order: '1' })
})
