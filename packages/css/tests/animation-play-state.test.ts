import { testProp } from './css'

it('animation-play-state', () => {
    testProp(['animation-play-state:running', '@play:running'], 'animation-play-state:running')
    testProp(['animation-play-state:paused', '@play:paused'], 'animation-play-state:paused')
})