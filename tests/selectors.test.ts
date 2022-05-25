import { testCSS } from "./utils/test-css"

test("breakpoints", () => {
    testCSS("hide@xs", "@media (min-width:600px){.hide\\@xs{display:none}}")
})
