import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('text-overflow', () => {
    expect(createCSS().create('text:clip')?.text).toContain('text-overflow:clip')
    expect(createCSS().create('text-overflow:clip')?.text).toContain('text-overflow:clip')

    expect(createCSS().create('text:ellipsis')?.text).toContain('text-overflow:ellipsis')
    expect(createCSS().create('text-overflow:ellipsis')?.text).toContain('text-overflow:ellipsis')
})