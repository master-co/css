import { it, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('animation-play-state', () => {
    expect(createCSSWithTheme().create('animation-play-state:running')?.declarations).toStrictEqual({ 'animation-play-state': 'running' })
    expect(createCSSWithTheme().create('@play:running')).toBeUndefined()

    expect(createCSSWithTheme().create('animation-play-state:paused')?.declarations).toStrictEqual({ 'animation-play-state': 'paused' })
    expect(createCSSWithTheme().create('@play:paused')).toBeUndefined()
})
