import { testProp } from './css'

test('scroll-snap-type', () => {
    testProp(['scroll-snap:x', 'scroll-snap-type:x'], 'scroll-snap-type:x')
    testProp('scroll-snap-type:both|mandatory', 'scroll-snap-type:both mandatory')
})
