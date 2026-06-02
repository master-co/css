import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('box', () => {
    expect(createCSSWithTheme().create('box-content')?.text).toContain('box-sizing:content-box')
    expect(createCSSWithTheme().create('box-sizing:content-box')?.text).toContain('box-sizing:content-box')
})