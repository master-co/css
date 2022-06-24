import { testCSS } from "../utils/test-css"

test("group", () => {
    testCSS("{color:indigo!;bb:2|solid}", ".\\\{color\\\:indigo\\\!\\\;bb\\\:2\\\|solid\\\}{color:#5a5bd5!important;border-bottom:0.125rem solid}")
})
