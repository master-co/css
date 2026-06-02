import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('line-height', () => {
    expect(createCSSWithTheme().create('line-h:calc(2-1.5)')?.text).toBe('.line-h\\:calc\\(2-1\\.5\\){line-height:calc(2 - 1.5)}')
})
