import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('box', () => {
    expect(createCSS().create('box:content')?.text).toContain('box-sizing:content-box')
    expect(createCSS().create('box-sizing:content-box')?.text).toContain('box-sizing:content-box')
})