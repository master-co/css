import { testCSS } from "./utils/test-css"

test("breakpoints", () => {
    testCSS("hide@xs", "@media (min-width:600px){.hide\\@xs{display:none}}")
    testCSS("hide:last-child", ".hide\\:last-child:last-child{display:none}")
})
