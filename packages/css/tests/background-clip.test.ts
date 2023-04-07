import { testProp } from './css'

it('background clip', () => {
    testProp('bg:text', '-webkit-background-clip:text;background-clip:text')
})
