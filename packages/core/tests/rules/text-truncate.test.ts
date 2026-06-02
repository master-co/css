import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('text-truncate', () => {
    expect(createCSSWithTheme().create('text-truncate:3')?.text).toBe('.text-truncate\\:3{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;overflow-wrap:break-word;text-overflow:ellipsis}')
    expect(createCSSWithTheme().create('lines:3')?.text).toBe('.lines\\:3{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;overflow-wrap:break-word;text-overflow:ellipsis}')
})
