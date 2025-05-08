import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('animation-play-state', () => {
    expect(createCSS().create('animation-play-state:running')?.declarations).toStrictEqual({ 'animation-play-state': 'running' })
    expect(createCSS().create('@play:running')?.declarations).toStrictEqual({ 'animation-play-state': 'running' })

    expect(createCSS().create('animation-play-state:paused')?.declarations).toStrictEqual({ 'animation-play-state': 'paused' })
    expect(createCSS().create('@play:paused')?.declarations).toStrictEqual({ 'animation-play-state': 'paused' })
})