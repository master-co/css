import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('animation-direction', () => {
    expect(createCSS().create('animation-direction:normal')?.declarations).toStrictEqual({ 'animation-direction': 'normal' })
    expect(createCSS().create('@direction:normal')?.declarations).toStrictEqual({ 'animation-direction': 'normal' })

    expect(createCSS().create('animation-direction:reverse')?.declarations).toStrictEqual({ 'animation-direction': 'reverse' })
    expect(createCSS().create('@direction:reverse')?.declarations).toStrictEqual({ 'animation-direction': 'reverse' })

    expect(createCSS().create('animation-direction:alternate')?.declarations).toStrictEqual({ 'animation-direction': 'alternate' })
    expect(createCSS().create('@direction:alt')?.declarations).toStrictEqual({ 'animation-direction': 'alternate' })

    expect(createCSS().create('animation-direction:alternate-reverse')?.declarations).toStrictEqual({ 'animation-direction': 'alternate-reverse' })
    expect(createCSS().create('@direction:alt-reverse')?.declarations).toStrictEqual({ 'animation-direction': 'alternate-reverse' })
})