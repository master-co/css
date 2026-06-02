import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('transform', () => {
    expect(createCSSWithTheme().create('translate(16)')?.text).toBe('.translate\\(16\\){transform:translate(1rem)}')
    expect(createCSSWithTheme().create('translateY(-5):hover')?.text).toBe('.translateY\\(-5\\)\\:hover:hover{transform:translateY(-0.3125rem)}')
    expect(createCSSWithTheme().create('transform:translateY(-5):hover')?.text).toBe('.transform\\:translateY\\(-5\\)\\:hover:hover{transform:translateY(-0.3125rem)}')
})

test.concurrent('transform-box', ()=> {
    expect(createCSSWithTheme().create('transform-content')?.text).toContain('transform-box:content-box')
})