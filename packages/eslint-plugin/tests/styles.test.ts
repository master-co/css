import rule from '../src/rules/class-validation'
import { jsxTester } from './testers'

jsxTester.run('class matching components', rule, {
    valid: [
        { code: 'export default { components: { btn: [{ selector: "&", declarations: { display: "block" } }] } }' },
        { code: 'export default { components: { btn: [{ selector: "&", declarations: { fontSize: "0.75rem", height: "1.5rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", borderRadius: "0.5rem" } }, { selector: "&", declarations: { display: "inline-flex" } }] } }' },
        { code: 'export default { components: { btn: [{ selector: "&", declarations: { color: "bg:error" } }] } }' }
    ],
    invalid: [
        {
            code: 'const classes = "bg:error"',
            settings: { '@master/css': { classDeclarations: ['classes'] } },
            errors: [{ messageId: 'invalidClass' }]
        },
        {
            code: 'const classes = { btn: ["bg:error"] }',
            settings: { '@master/css': { classDeclarations: ['classes'] } },
            errors: [{ messageId: 'invalidClass' }]
        },
    ]
})
