import rule from '../../../src/rules/class-order'
import { jsxTester, source } from '../../testers'

jsxTester.run('order', rule, {
    valid: [
        source('1.input.tsx', import.meta.url)
    ],
    invalid: []
})