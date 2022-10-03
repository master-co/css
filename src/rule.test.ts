import { testCSS } from './utils/test-css';
import { MasterCSSRule } from './rule';

test("classes", () => {
    MasterCSSRule.extend('classes', {
        '?': 'font:14 text:center h:40 px:20 fg:#fff:hover'
    });

    testCSS("?", ".px\\:20, .\\?{padding-left:1.25rem;padding-right:1.25rem}.h\\:40, .\\?{height:2.5rem}.text\\:center, .\\?{text-align:center}.font\\:14, .\\?{font-size:0.875rem}.fg\\:\\#fff\\:hover:hover, .\\?:hover{color:#fff}")
});

test("breakpoints", () => {
    MasterCSSRule.extend('breakpoints', {
        'xss': 500
    });

    testCSS("hide@xss", "@media (min-width:500px){.hide\\@xss{display:none}}")
});

test("colors", () => {
    MasterCSSRule.extend('colors', {
        newColor: {
            10: '131518',
            50: '63697c',
            90: 'f4f4f6'
        }
    });

    testCSS("fg:newColor", ".fg\\:newColor{color:#63697c}")
});

test("mediaQueries", () => {
    MasterCSSRule.extend('mediaQueries', {
        'min-600': '(min-width: 600px)'
    });

    testCSS("f:12@min-600", "@media (min-width: 600px){.f\\:12\\@min-600{font-size:0.75rem}}")
});
