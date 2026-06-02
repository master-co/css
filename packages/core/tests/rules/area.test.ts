import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('area', () => {
    expect(createCSSWithTheme().create('full')?.text).toContain('width:100%;height:100%')
})
