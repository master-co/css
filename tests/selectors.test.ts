import { testCSS } from "./utils/test-css"

test("breakpoints", () => {
    testCSS("hide@xs", "@media (min-width:600px){.hide\\@xs{display:none}}")
    testCSS("hide:first", ".hide\\:first:first-child{display:none}")
    testCSS("hide:last", ".hide\\:last:last-child{display:none}")
    testCSS("hide:even", ".hide\\:even:nth-child(2n){display:none}")
    testCSS("hide:odd", ".hide\\:odd:nth-child(odd){display:none}")
})
