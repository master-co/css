import { testCSS } from './test-css'

test('transition', () => {
    testCSS('~transform|.1s|ease-out,width|.1s|ease-out', '.\\~transform\\|\\.1s\\|ease-out\\,width\\|\\.1s\\|ease-out{transition:transform .1s ease-out,width .1s ease-out}')
})
