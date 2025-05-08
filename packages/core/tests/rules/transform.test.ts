import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('transform', () => {
    expect(createCSS().create('translate(16)')?.text).toBe('.translate\\(16\\){transform:translate(1rem)}')
    expect(createCSS().create('translateY(-5):hover')?.text).toBe('.translateY\\(-5\\)\\:hover:hover{transform:translateY(-0.3125rem)}')
    expect(createCSS().create('transform:translateY(-5):hover')?.text).toBe('.transform\\:translateY\\(-5\\)\\:hover:hover{transform:translateY(-0.3125rem)}')
})

test.concurrent('transform-box', ()=> {
    expect(createCSS().create('transform:padding')?.text).toContain('transform-box:padding-box')
})