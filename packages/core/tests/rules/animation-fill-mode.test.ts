import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('animation-fill-mode', () => {
    expect(createCSSWithTheme().create('animation-fill-mode:forwards')?.declarations).toStrictEqual({ 'animation-fill-mode': 'forwards' })
    expect(createCSSWithTheme().create('@fill:forwards')?.declarations).toStrictEqual({ 'animation-fill-mode': 'forwards' })

    expect(createCSSWithTheme().create('animation-fill-mode:backwards')?.declarations).toStrictEqual({ 'animation-fill-mode': 'backwards' })
    expect(createCSSWithTheme().create('@fill:backwards')?.declarations).toStrictEqual({ 'animation-fill-mode': 'backwards' })

    expect(createCSSWithTheme().create('animation-fill-mode:both')?.declarations).toStrictEqual({ 'animation-fill-mode': 'both' })
    expect(createCSSWithTheme().create('@fill:both')?.declarations).toStrictEqual({ 'animation-fill-mode': 'both' })

    expect(createCSSWithTheme().create('animation-fill-mode:none')?.declarations).toStrictEqual({ 'animation-fill-mode': 'none' })
    expect(createCSSWithTheme().create('@fill:none')?.declarations).toStrictEqual({ 'animation-fill-mode': 'none' })

    expect(createCSSWithTheme().create('animation-fill-mode:revert')?.declarations).toStrictEqual({ 'animation-fill-mode': 'revert' })
    expect(createCSSWithTheme().create('@fill:revert')?.declarations).toStrictEqual({ 'animation-fill-mode': 'revert' })

    expect(createCSSWithTheme().create('animation-fill-mode:revert-layer')?.declarations).toStrictEqual({ 'animation-fill-mode': 'revert-layer' })
    expect(createCSSWithTheme().create('@fill:revert-layer')?.declarations).toStrictEqual({ 'animation-fill-mode': 'revert-layer' })
})