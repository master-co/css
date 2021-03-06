import { testCSS } from './utils/test-css';
import { Style } from './style';

test("classes", () => {
    Style.extend('classes', {
        '?': 'font:14 text:center h:40 px:20 f:red:hover'
    });

    testCSS("?", ".px\\:20, .\\?{padding-left:1.25rem;padding-right:1.25rem}.h\\:40, .\\?{height:2.5rem}.text\\:center, .\\?{text-align:center}.font\\:14, .\\?{font-size:0.875rem}.f\\:red\\:hover:hover, .\\?:hover{color:#d11a1e}")
});

test("breakpoints", () => {
    Style.extend('breakpoints', {
        'xss': 500
    });

    testCSS("hide@xss", "@media (min-width:500px){.hide\\@xss{display:none}}")
});

test("colors", () => {
    Style.extend('colors', {
        newColor: {
            10: '131518',
            50: '63697c',
            90: 'f4f4f6'
        }
    });

    testCSS("f:newColor", ".f\\:newColor{color:#63697c}")
});

test("mediaQueries", () => {
    Style.extend('mediaQueries', {
        'min-600': '(min-width: 600px)'
    });

    testCSS("f:12@min-600", "@media (min-width: 600px){.f\\:12\\@min-600{font-size:0.75rem}}")
});
