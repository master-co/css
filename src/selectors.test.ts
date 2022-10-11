import { testCSS } from "./utils/test-css"

test("breakpoints", () => {
    testCSS("hide@xs", "@media (min-width:600px){.hide\\@xs{display:none}}")
})

test("shorthands", () => {
    testCSS("hide:first", ".hide\\:first:first-child{display:none}")
    testCSS("hide:last", ".hide\\:last:last-child{display:none}")
    testCSS("hide:even", ".hide\\:even:nth-child(2n){display:none}")
    testCSS("hide:odd", ".hide\\:odd:nth-child(odd){display:none}")
    testCSS("hide:nth(2)", ".hide\\:nth\\(2\\):nth-child(2){display:none}")
    testCSS("hide:first:focus", ".hide\\:first\\:focus:first-child:focus{display:none}")
    testCSS("uppercase::first-letter", ".uppercase\\:\\:first-letter::first-letter{text-transform:uppercase}")
})

test("reactive-rules", () => {
    testCSS(":checked+{hide}", ":checked+.\\:checked\\+\\{hide\\}{display:none}")
})

test("multiple", () => {
    testCSS("bg:black>li:nth(2):not(:nth(4))", ".bg\\:black\\>li\\:nth\\(2\\)\\:not\\(\\:nth\\(4\\)\\)>li:nth-child(2):not(:nth-child(4)){background-color:#000000}")
    testCSS("bg:black::slider-thumb", ".bg\\:black\\:\\:slider-thumb::-webkit-slider-thumb, .bg\\:black\\:\\:slider-thumb::-moz-range-thumb{background-color:#000000}")
    testCSS("content:'⦿':after,:before", ".content\\:\\'⦿\\'\\:after\\,\\:before:after, .content\\:\\'⦿\\'\\:after\\,\\:before:before{content:'⦿'}")
})