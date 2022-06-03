import { testCSS } from "../utils/test-css"

test("max-width", () => {
    testCSS("max-w:md", ".max-w\\:md{max-width:64rem}")
})