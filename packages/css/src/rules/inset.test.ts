import { testCSS } from '../utils/test-css'

test('inset', () => {
    testCSS('top:20', '.top\\:20{top:1.25rem}')
    testCSS('bottom:10', '.bottom\\:10{bottom:0.625rem}')
    testCSS('inset:16', '.inset\\:16{inset:1rem}')
    testCSS('left:30', '.left\\:30{left:1.875rem}')
})