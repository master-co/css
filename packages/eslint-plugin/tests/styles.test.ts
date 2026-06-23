import rule from '../src/rules/class-validation'
import { jsxTester } from './testers'

jsxTester.run('class matching main utilities', rule, {
    valid: [
        { code: 'import UtilityType from "@master/css-schema/utility-type"; export default { utilities: [{ name: "btn", type: UtilityType.Semantic, layer: "components", rules: [{ selector: "&", declarations: { display: "block" } }] }] }' },
        { code: 'import UtilityType from "@master/css-schema/utility-type"; export default { utilities: [{ name: "btn", type: UtilityType.Semantic, layer: "components", rules: [{ selector: "&", declarations: { fontSize: "0.75rem", height: "1.5rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", borderRadius: "0.5rem" } }, { selector: "&", declarations: { display: "inline-flex" } }] }] }' },
        { code: 'import UtilityType from "@master/css-schema/utility-type"; export default { utilities: [{ name: "btn", type: UtilityType.Semantic, layer: "components", rules: [{ selector: "&", declarations: { color: "red" } }] }] }' }
    ],
    invalid: [
        {
            code: 'const classes = "text-decoration:bad()"',
            settings: { '@master/css': { classDeclarations: ['classes'] } },
            errors: [{ messageId: 'invalidClass' }]
        },
        {
            code: 'const classes = { btn: ["text-decoration:bad()"] }',
            settings: { '@master/css': { classDeclarations: ['classes'] } },
            errors: [{ messageId: 'invalidClass' }]
        },
    ]
})
