import rule from '../../src/rules/sort-classes'
import { jsxTester, source } from '../testers'

jsxTester.run('order', rule, {
    valid: [],
    invalid: [
        {
            ...source('../fixtures/issues/375/1.input.tsx', import.meta.url),
            output: source('../fixtures/issues/375/1.output.tsx', import.meta.url).code,
            errors: [
                { messageId: 'invalidClassOrder', line: 5, column: 26, endLine: 10, endColumn: 9 },
            ]
        }
    ]
})
