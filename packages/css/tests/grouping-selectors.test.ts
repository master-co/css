import { testCSS } from './css'

test('grouping selectors', () => {
    testCSS('{fg:yellow;bg:red}_h1,_button', '.\\{fg\\:yellow\\;bg\\:red\\}_h1\\,_button h1,.\\{fg\\:yellow\\;bg\\:red\\}_h1\\,_button button{color:rgb(128 103 0);background-color:rgb(209 26 30)}')
    // testCSS('block:before,:after', '.block\\:before\\,\\:after:before,.block\\:before\\,\\:after:after{display:block}')
})
