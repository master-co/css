import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('text-truncate', () => {
    expect(createCSS().create('text-truncate:3')?.text).toBe('.text-truncate\\:3{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;overflow-wrap:break-word;text-overflow:ellipsis}')
    expect(createCSS().create('lines:3')?.text).toBe('.lines\\:3{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;overflow-wrap:break-word;text-overflow:ellipsis}')
})
