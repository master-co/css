import { testCSS, testProp } from '../src/utils/test-css'

test('content', () => {
    testCSS('content:\'foo\'', '.content\\:\\\'foo\\\'{content:\'foo\'}')
    testProp('content:\'foo\'')
    testProp('content:\'fo\\\'o\'')
})
