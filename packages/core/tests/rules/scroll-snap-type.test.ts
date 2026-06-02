import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('scroll-snap-type', () => {
    expect(createCSSWithTheme().create('scroll-snap:x')?.text).toContain('scroll-snap-type:x')
    expect(createCSSWithTheme().create('scroll-snap-type:x')?.text).toContain('scroll-snap-type:x')
    expect(createCSSWithTheme().create('scroll-snap-type:x|mandatory')?.text).toContain('scroll-snap-type:x mandatory')
})
