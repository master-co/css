import { it, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('animation-fill-mode', () => {
    expect(createCSSWithTheme().create('animation-fill-mode:forwards')?.declarations).toStrictEqual({ 'animation-fill-mode': 'forwards' })
    expect(createCSSWithTheme().create('@fill:forwards')).toBeUndefined()

    expect(createCSSWithTheme().create('animation-fill-mode:backwards')?.declarations).toStrictEqual({ 'animation-fill-mode': 'backwards' })
    expect(createCSSWithTheme().create('@fill:backwards')).toBeUndefined()

    expect(createCSSWithTheme().create('animation-fill-mode:both')?.declarations).toStrictEqual({ 'animation-fill-mode': 'both' })
    expect(createCSSWithTheme().create('@fill:both')).toBeUndefined()

    expect(createCSSWithTheme().create('animation-fill-mode:none')?.declarations).toStrictEqual({ 'animation-fill-mode': 'none' })
    expect(createCSSWithTheme().create('@fill:none')).toBeUndefined()

    expect(createCSSWithTheme().create('animation-fill-mode:revert')?.declarations).toStrictEqual({ 'animation-fill-mode': 'revert' })
    expect(createCSSWithTheme().create('@fill:revert')).toBeUndefined()

    expect(createCSSWithTheme().create('animation-fill-mode:revert-layer')?.declarations).toStrictEqual({ 'animation-fill-mode': 'revert-layer' })
    expect(createCSSWithTheme().create('@fill:revert-layer')).toBeUndefined()
})
