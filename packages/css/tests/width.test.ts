import { testProp } from './css'

it('validates width rules', () => {
    testProp('w:sm', 'width:48rem')
})