import { expect, test } from 'vitest'
import { createCSS } from '../../src'
import createCSSWithTheme, { createThemeConfig } from '../helpers/create-css-with-theme'

test.concurrent('add an animation syntax top-level', () => {
    const css = createCSSWithTheme()
    css.add('animation:fade|.3s')
    expect(css.text).toEqual([
        '@layer utilities{.animation\\:fade\\|\\.3s{animation:fade 0.3s}}',
        '@keyframes fade{0%{opacity:0}to{opacity:1}}',
    ].join(''))
})

test.concurrent('does not duplicate preloaded animations', () => {
    const css = createCSS(createThemeConfig(), {
        animations: {
            fade: 1
        }
    })
    css.add('animation:fade|.3s')
    expect(css.text).toBe('@layer utilities{.animation\\:fade\\|\\.3s{animation:fade 0.3s}}')
    expect(Object.fromEntries(css.animationsNonLayer.tokenCounts)).toEqual({
        fade: 2
    })
    css.remove('animation:fade|.3s')
    expect(css.text).toBe('')
    expect(Object.fromEntries(css.animationsNonLayer.tokenCounts)).toEqual({
        fade: 1
    })
})
