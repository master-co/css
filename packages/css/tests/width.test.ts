import { testProp } from './css'

it('validates width rules', () => {
    testProp('w:sm', 'width:52.125rem')
    testProp('w:1/4', 'width:25%')
})