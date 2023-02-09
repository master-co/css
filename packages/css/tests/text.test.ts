import { testProp } from '../src/utils/test-css'

test('text', () => {
    testProp('text:20', 'font-size:1.25rem;line-height:calc(1.25rem + 0.625em)')
    testProp('text:50%', 'font-size:50%;line-height:calc(50% + 0.625em)')

    testProp('text:#fff', '-webkit-text-fill-color:#fff')
    testProp('text:current', '-webkit-text-fill-color:currentColor')
    testProp('text:transparent', '-webkit-text-fill-color:transparent')
    testProp('text-fill:current', '-webkit-text-fill-color:currentColor')
    testProp('text-fill:transparent', '-webkit-text-fill-color:transparent')

    testProp('text-stroke:#fff', '-webkit-text-stroke-color:#fff')
    testProp('text-stroke:current', '-webkit-text-stroke-color:currentColor')
    testProp('text-stroke:transparent', '-webkit-text-stroke-color:transparent')
})
