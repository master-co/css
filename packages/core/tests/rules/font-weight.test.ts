import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('font-weight', () => {
    expect(createCSS().create('font:bolder')?.text).toBe('.font\\:bolder{font-weight:bolder}')
    expect(createCSS().create('font:thin')?.text).toBe('.font\\:thin{font-weight:100}')
})
