import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('grid-column', () => {
    expect(createCSSWithTheme().create('grid-col-span:2')?.text).toBe('.grid-col-span\\:2{grid-column:span 2/span 2}')
    expect(createCSSWithTheme().create('grid-column-span:2')?.text).toBe('.grid-column-span\\:2{grid-column:span 2/span 2}')
})
