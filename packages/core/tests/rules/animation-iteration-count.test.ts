import { it, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('animation-iteration-count', () => {
    expect(createCSSWithTheme().create('animation-iteration-count:infinite')?.declarations).toStrictEqual({ 'animation-iteration-count': 'infinite' })
    expect(createCSSWithTheme().create('@iteration:infinite')).toBeUndefined()

    expect(createCSSWithTheme().create('animation-iteration-count:1')?.declarations).toStrictEqual({ 'animation-iteration-count': '1' })
    expect(createCSSWithTheme().create('@iteration:1')).toBeUndefined()
})
