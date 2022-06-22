import { testProp } from "../utils/test-css"

test("background-clip", () => {
    testProp("background-clip:border", "-webkit-background-clip:border-box;background-clip:border-box")
})
