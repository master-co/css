import { testProp } from './css'

test('outline', () => {
    testProp('outline:current', 'outline-color:currentColor')
    testProp('outline:transparent', 'outline-color:transparent')
    testProp('outline:black', 'outline-color:#000000')
    testProp('outline:2|black', 'outline:0.125rem #000000 solid')
})
