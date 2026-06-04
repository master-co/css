import { it, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('animation-direction', () => {
    expect(createCSSWithTheme().create('animation-direction:normal')?.declarations).toStrictEqual({ 'animation-direction': 'normal' })
    expect(createCSSWithTheme().create('@direction:normal')).toBeUndefined()

    expect(createCSSWithTheme().create('animation-direction:reverse')?.declarations).toStrictEqual({ 'animation-direction': 'reverse' })
    expect(createCSSWithTheme().create('@direction:reverse')).toBeUndefined()

    expect(createCSSWithTheme().create('animation-direction:alternate')?.declarations).toStrictEqual({ 'animation-direction': 'alternate' })
    expect(createCSSWithTheme().create('@direction:alternate')).toBeUndefined()

    expect(createCSSWithTheme().create('animation-direction:alternate-reverse')?.declarations).toStrictEqual({ 'animation-direction': 'alternate-reverse' })
    expect(createCSSWithTheme().create('@direction:alternate-reverse')).toBeUndefined()
})
