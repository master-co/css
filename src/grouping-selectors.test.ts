import { testCSS } from './utils/test-css'

test("grouping selectors", () => {
    testCSS('{fg:yellow;bg:red}_h1,_button', '.\\{fg\\:yellow\\;bg\\:red\\}_h1\\,_button h1, .\\{fg\\:yellow\\;bg\\:red\\}_h1\\,_button button{color:#806700;background-color:#d11a1e}')
    testCSS('block:before,:after', '.block\\:before\\,\\:after:before, .block\\:before\\,\\:after:after{display:block}')
})