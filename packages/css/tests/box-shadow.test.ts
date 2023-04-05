import { testProp } from './css'

test('box-shadow', () => {
    testProp('box-shadow:8|8|10|#00b0de', 'box-shadow:0.5rem 0.5rem 0.625rem #00b0de')
    testProp('box-shadow:8|8|10|var(--my-shadow,#00b0de)', 'box-shadow:0.5rem 0.5rem 0.625rem var(--my-shadow,#00b0de)')
})
