import { testProp } from "../utils/test-css"

test("color", () => {
    testProp("color:current", "color:currentColor")
    testProp("fg:#fff", "color:#fff")
    testProp("fg:current", "color:currentColor")
    testProp("foreground:current", "color:currentColor")
})
