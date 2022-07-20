import { testProp, testCSS } from "../utils/test-css"

test("background", () => {
    testProp("bg:red", "background-color:#d11a1e")
    testProp("bg:#fff", "background-color:#fff")
    testCSS("bg:gray-90:hover@md@landscape", "@media (min-width:1024px) and (orientation:landscape){.bg\\:gray-90\\:hover\\@md\\@landscape:hover{background-color:#f4f4f6}}");
})
