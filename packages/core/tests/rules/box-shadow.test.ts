import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('box-shadow', () => {
    expect(createCSS().create('box-shadow:8|8|10|#00b0de')?.text).toContain('box-shadow:0.5rem 0.5rem 0.625rem #00b0de')
    expect(createCSS().create('box-shadow:8|8|10|var(--my-shadow,#00b0de)')?.text).toContain('box-shadow:0.5rem 0.5rem 0.625rem var(--my-shadow,#00b0de)')
})
