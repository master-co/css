import { testProp } from "../utils/test-css"

test("color", () => {
    testProp("color:current", "color:currentColor")
    testProp("font:current", "color:currentColor")
})
