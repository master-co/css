import rule from '../../src/rules/no-invalid-classes'
import { jsxTester, source } from '../testers'

jsxTester.run('order', rule, {
    valid: [],
    invalid: [
        {
            ...source('../fixtures/issues/387/1.input.tsx', import.meta.url),
            errors: [
                { messageId: 'invalidClass', line: 4, column: 22, endLine: 4, endColumn: 43 },
            ]
        }
    ]
})
