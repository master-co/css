import rule from '../src/rules/class-validation'
import { jsxTester } from './testers'

jsxTester.run('class matching main utilities', rule, {
    valid: [
        { code: 'export default { utilities: [{ name: "btn", type: -2, layer: "components", rules: [{ selector: "&", declarations: { display: "block" } }] }] }' },
        { code: 'export default { utilities: [{ name: "btn", type: -2, layer: "components", rules: [{ selector: "&", declarations: { fontSize: "0.75rem", height: "1.5rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", borderRadius: "0.5rem" } }, { selector: "&", declarations: { display: "inline-flex" } }] }] }' },
        { code: 'export default { utilities: [{ name: "btn", type: -2, layer: "components", rules: [{ selector: "&", declarations: { color: "text-align:cente" } }] }] }' }
    ],
    invalid: [
        {
            code: 'const classes = "text-align:cente"',
            settings: { '@master/css': { classDeclarations: ['classes'] } },
            errors: [{ messageId: 'invalidClass' }]
        },
        {
            code: 'const classes = { btn: ["text-align:cente"] }',
            settings: { '@master/css': { classDeclarations: ['classes'] } },
            errors: [{ messageId: 'invalidClass' }]
        },
    ]
})
