import { testProp } from './css'

it('animation-direction', () => {
    testProp(['animation-direction:normal', '@direction:normal'], 'animation-direction:normal')
    testProp(['animation-direction:reverse', '@direction:reverse'], 'animation-direction:reverse')
    testProp(['animation-direction:alternate', '@direction:alt'], 'animation-direction:alternate')
    testProp(['animation-direction:alternate-reverse', '@direction:alt-reverse'], 'animation-direction:alternate-reverse')
})