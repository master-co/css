import { testCSS } from './test-css'

it('flex', () => {
    testCSS('flex:1|1|auto', '.flex\\:1\\|1\\|auto{flex:1 1 auto}')
    // testCSS('flex:hover', '.flex\\:hover{flex: hover}')
})
