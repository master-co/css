import { testProp } from './css'

test('scroll-snap-type', () => {
    testProp('scroll-snap:x|mandatory', 'scroll-snap-type:x mandatory')
    testProp('scroll-snap:both|mandatory', 'scroll-snap-type:both mandatory')
})
