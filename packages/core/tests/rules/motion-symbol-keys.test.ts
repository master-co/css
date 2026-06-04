import { expect, test } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'

test.concurrent('motion symbol key aliases are unsupported', () => {
    const css = createCSSWithTheme()

    for (const className of [
        '@name:fade',
        '@duration:fast',
        '@delay:300ms',
        '@easing:smooth',
        '@direction:alternate',
        '@fill:both',
        '@iteration:infinite',
        '@play:running',
        '~property:opacity',
        '~duration:fast',
        '~delay:300ms',
        '~easing:smooth'
    ]) {
        expect(css.create(className), className).toBeUndefined()
    }
})

