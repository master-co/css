import { testProp } from "../utils/test-css"

test("text", () => {
    testProp("text:20", "font-size:1.25rem;line-height:1.625rem")
    testProp("text:current", "-webkit-text-fill-color:currentColor")
    testProp("text-fill:current", "-webkit-text-fill-color:currentColor")
    testProp("text:transparent", "-webkit-text-fill-color:transparent")
    testProp("text-fill:transparent", "-webkit-text-fill-color:transparent")
    testProp("text:#fff", "-webkit-text-fill-color:#fff")
})
