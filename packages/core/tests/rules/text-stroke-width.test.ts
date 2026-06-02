import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('text-stroke-width', () => {
    expect(createCSSWithTheme().create('text-stroke:thin')?.text).toContain('-webkit-text-stroke-width:thin')
    expect(createCSSWithTheme().create('text-stroke-width:thin')?.text).toContain('text-stroke-width:thin')
})