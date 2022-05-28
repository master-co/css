import { testCSS } from "./utils/test-css"

test("breakpoints", () => {
    testCSS("hide@xs", "@media (min-width:600px){.hide\\@xs{display:none}}")
})

test("shorthands", () => {
    testCSS("hide:first", ".hide\\:first:first-child{display:none}")
    testCSS("hide:last", ".hide\\:last:last-child{display:none}")
    testCSS("hide:even", ".hide\\:even:nth-child(2n){display:none}")
    testCSS("hide:odd", ".hide\\:odd:nth-child(odd){display:none}")
    testCSS("hide:first:focus", ".hide\\:first\\:focus:first-child:focus{display:none}")
    testCSS("uppercase::first-letter", ".uppercase\\:\\:first-letter::first-letter{text-transform:uppercase}")
})
