import { testProp } from './css'

it('validates width rules', () => {
    testProp('w:sm', 'width:52.125rem')
    testProp('w:1/4', 'width:25%')
})

test('sizing', () => {
    testProp('w:full', 'width:100%')
    testProp('w:fit', 'width:fit-content')
    testProp('w:max', 'width:max-content')
    testProp('w:min', 'width:min-content')
    testProp('w:4xs', 'width:22.5rem')
    testProp('w:3xs', 'width:30rem')
    testProp('w:2xs', 'width:37.5rem')
    testProp('w:xs', 'width:48rem')
    testProp('w:sm', 'width:52.125rem')
    testProp('w:md', 'width:64rem')
    testProp('w:lg', 'width:80rem')
    testProp('w:xl', 'width:90rem')
    testProp('w:2xl', 'width:100rem')
    testProp('w:3xl', 'width:120rem')
    testProp('w:4xl', 'width:160rem')
})