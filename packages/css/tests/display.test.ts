import { testCSS } from './css'

test('display', () => {
    testCSS('flex', '.flex{display:flex}')
    testCSS('flex@sm', '@media (min-width:834px){.flex\\@sm{display:flex}}')
})
