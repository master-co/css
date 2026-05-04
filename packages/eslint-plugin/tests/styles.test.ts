import rule from '../src/rules/class-validation'
import { jsxTester } from './testers'

jsxTester.run('class matching components', rule, {
    valid: [
        { code: 'export default { components: { btn: "block" } }' },
        { code: 'export default { components: { btn: { classNames: "font:12 h:6x px:2x r:2x", declarations: { display: "inline-flex" } } } }' },
        { code: 'export default { components: { btn: { primary: "bg:error" } } }' }
    ],
    invalid: [
        { code: 'export default { components: { btn: "bg:error" } }', errors: [{ messageId: 'invalidClass' }] },
        { code: 'export default { components: { btn: { classNames: "bg:error" } } }', errors: [{ messageId: 'invalidClass' }] },
        { code: 'const components = "bg:error"', errors: [{ messageId: 'invalidClass' }] },
        { code: 'const components = { btn: { classNames: "bg:error" } }', errors: [{ messageId: 'invalidClass' }] },
    ]
})
