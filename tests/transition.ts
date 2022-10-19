import { testCSS } from './utils/test-css'

test('transition', () => {
    testCSS('~transform|.1s|ease-out,width|.1s|ease-out', '.\\~transform\\|\\.1s\\|ease-out\\,width\\|\\.1s\\|ease-out{transition:transform 0.1s ease-out,width 0.1s ease-out}')
})
