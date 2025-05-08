import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('line-height', () => {
    expect(createCSS().create('line-h:calc(2-1.5)')?.text).toBe('.line-h\\:calc\\(2-1\\.5\\){line-height:calc(2 - 1.5)}')
})
