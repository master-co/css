import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('animation-iteration-count', () => {
    expect(createCSS().create('animation-iteration-count:infinite')?.declarations).toStrictEqual({ 'animation-iteration-count': 'infinite' })
    expect(createCSS().create('@iteration:infinite')?.declarations).toStrictEqual({ 'animation-iteration-count': 'infinite' })

    expect(createCSS().create('animation-iteration-count:1')?.declarations).toStrictEqual({ 'animation-iteration-count': '1' })
    expect(createCSS().create('@iteration:1')?.declarations).toStrictEqual({ 'animation-iteration-count': '1' })
})