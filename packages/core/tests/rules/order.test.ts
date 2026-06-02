import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('oreder', () => {
    expect(createCSSWithTheme().create('order:1')?.declarations).toStrictEqual({ order: '1' })
    expect(createCSSWithTheme().create('o:1')?.declarations).toStrictEqual({ order: '1' })
})
