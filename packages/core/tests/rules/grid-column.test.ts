import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('grid-column', () => {
    expect(createCSS().create('grid-col-span:2')?.text).toBe('.grid-col-span\\:2{grid-column:span 2/span 2}')
    expect(createCSS().create('grid-column-span:2')?.text).toBe('.grid-column-span\\:2{grid-column:span 2/span 2}')
})
