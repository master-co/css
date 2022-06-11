import { testCSS } from "../utils/test-css"

test("group", () => {
    testCSS("{color:indigo!;bb:2|solid}", ".\\\{color\\\:indigo\\\!\\\;bb\\\:2\\\|solid\\\}{color:rgb(var(--indigo))!important;border-bottom:0.125rem solid}")
})
