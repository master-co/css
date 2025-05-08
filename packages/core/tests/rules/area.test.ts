import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('area', () => {
    expect(createCSS().create('full')?.text).toContain('width:100%;height:100%')
})
