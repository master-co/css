import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('line-height', () => {
    expect(createCSSWithTheme().create('line-h:calc(2-1.5)')?.text).toBe('.line-h\\:calc\\(2-1\\.5\\){line-height:calc(2 - 1.5)}')
    expect(createCSSWithTheme().create('leading:md')?.text).toBe('.leading\\:md{line-height:var(--leading-md)}')
    expect(createCSSWithTheme().create('line-height:md')?.text).toBe('.line-height\\:md{line-height:var(--leading-md)}')
})
