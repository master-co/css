import { testProp } from "../utils/test-css"

test("background", () => {
    testProp("bg:red", "background-color:#d11a1e")
    testProp("bg:#fff", "background-color:#fff")
})
