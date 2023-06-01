import { testProp } from './css'

it('animation-fill-mode', () => {
    testProp(['animation-fill-mode:forwards', '@fill:forwards'], 'animation-fill-mode:forwards')
    testProp(['animation-fill-mode:backwards', '@fill:backwards'], 'animation-fill-mode:backwards')
    testProp(['animation-fill-mode:both', '@fill:both'], 'animation-fill-mode:both')
    testProp(['animation-fill-mode:none', '@fill:none'], 'animation-fill-mode:none')
})