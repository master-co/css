import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('animation-fill-mode', () => {
    expect(createCSS().create('animation-fill-mode:forwards')?.declarations).toStrictEqual({ 'animation-fill-mode': 'forwards' })
    expect(createCSS().create('@fill:forwards')?.declarations).toStrictEqual({ 'animation-fill-mode': 'forwards' })

    expect(createCSS().create('animation-fill-mode:backwards')?.declarations).toStrictEqual({ 'animation-fill-mode': 'backwards' })
    expect(createCSS().create('@fill:backwards')?.declarations).toStrictEqual({ 'animation-fill-mode': 'backwards' })

    expect(createCSS().create('animation-fill-mode:both')?.declarations).toStrictEqual({ 'animation-fill-mode': 'both' })
    expect(createCSS().create('@fill:both')?.declarations).toStrictEqual({ 'animation-fill-mode': 'both' })

    expect(createCSS().create('animation-fill-mode:none')?.declarations).toStrictEqual({ 'animation-fill-mode': 'none' })
    expect(createCSS().create('@fill:none')?.declarations).toStrictEqual({ 'animation-fill-mode': 'none' })

    expect(createCSS().create('animation-fill-mode:revert')?.declarations).toStrictEqual({ 'animation-fill-mode': 'revert' })
    expect(createCSS().create('@fill:revert')?.declarations).toStrictEqual({ 'animation-fill-mode': 'revert' })

    expect(createCSS().create('animation-fill-mode:revert-layer')?.declarations).toStrictEqual({ 'animation-fill-mode': 'revert-layer' })
    expect(createCSS().create('@fill:revert-layer')?.declarations).toStrictEqual({ 'animation-fill-mode': 'revert-layer' })
})