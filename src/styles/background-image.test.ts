import { testProp } from "../utils/test-css"

test("background-image", () => {
    testProp("bg:linear-gradient(0deg,var(--gray-14)|0%,var(--gray-16)|100%)", "background-image:linear-gradient(0deg,#1b1b1b 0%,#1e1e1e 100%)")
})
