import { testProp } from './css'

it('animation-iteration-count', () => {
    testProp(['animation-iteration-count:infinite', '@iteration:infinite'], 'animation-iteration-count:infinite')
    testProp(['animation-iteration-count:1', '@iteration:1'], 'animation-iteration-count:1')
})