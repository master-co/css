import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('text-stroke-width', () => {
    expect(createCSS().create('text-stroke:thin')?.text).toContain('-webkit-text-stroke-width:thin')
    expect(createCSS().create('text-stroke-width:thin')?.text).toContain('text-stroke-width:thin')
})