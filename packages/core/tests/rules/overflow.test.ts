import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('overflow', () => {
    expect(createCSSWithTheme().create('overflow')?.text).toContain('overflow:visible')
    expect(createCSSWithTheme().create('overflow:hidden')?.text).toContain('overflow:hidden')
    expect(createCSSWithTheme().create('overflow:overlay')?.text).toContain('overflow:overlay')
    expect(createCSSWithTheme().create('overflow-x:overlay')?.text).toContain('overflow-x:overlay')
    expect(createCSSWithTheme().create('overflow-y:overlay')?.text).toContain('overflow-y:overlay')
})
