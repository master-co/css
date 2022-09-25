import { testProp } from "../utils/test-css"

test("outline", () => {
    testProp("outline:current", "outline-color:currentColor")
    testProp("outline:transparent", "outline-color:transparent")
    testProp("outline:black", "outline-color:#000000")
})
