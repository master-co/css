import { expect, test } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('add an animation syntax top-level', () => {
    const css = createCSSWithTheme()
    css.add('@fade|.3s')
    expect(css.text).toEqual([
        '@layer general{.\\@fade\\|\\.3s{animation:fade 0.3s}}',
        '@keyframes fade{0%{opacity:0}to{opacity:1}}',
    ].join(''))
})
