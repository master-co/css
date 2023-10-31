import { testCSS } from './css'

test('text fill colors', () => {
    testCSS('t:blue-60', '.t\\:blue-60{-webkit-text-fill-color:rgb(107 158 241)}')
    testCSS('text-fill-color:blue-60', '.text-fill-color\\:blue-60{-webkit-text-fill-color:rgb(107 158 241)}')
})
