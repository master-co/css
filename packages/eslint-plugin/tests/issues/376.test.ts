import rule from '../../src/rules/sort-classes'
import { jsxTester, source } from '../testers'

jsxTester.run('order', rule, {
    valid: [
        source('../fixtures/issues/376/1.input.tsx', import.meta.url)
    ],
    invalid: []
})
