import { testProp } from "../utils/test-css"

test("background", () => {
    testProp("bg:red", "background-color:rgb(var(--red))")
    testProp("bg:#fff", "background-color:#fff")
})
