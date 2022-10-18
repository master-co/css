import { testCSS } from '../utils/test-css'

test('text fill colors', () => {
    testCSS('t:blue-60', '.t\\:blue-60{-webkit-text-fill-color:#6b9ef1}')
})
