import OrderRule from '../src/rules/sort-classes'
import CollisionRule from '../src/rules/no-conflicting-classes'
import { jsxTester } from './testers'

jsxTester.run('mdx sort classes', OrderRule, {
    valid: [{ code: `<div class="m:2x p:2x bg:black fg:white font:1.5rem">Simple, basic</div>` }],
    invalid: [
        {
            code: `
            # Test
            <div class="m:2x bg:black p:2x fg:white font:1.5rem">Simple</div>`,
            output: `
            # Test
            <div class="m:2x p:2x bg:black fg:white font:1.5rem">Simple</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            filename: 'test.mdx',
            languageOptions: {
                parser: await import('eslint-mdx')
            }
        },
    ],
})

jsxTester.run('mdx no conflicting classes', CollisionRule, {
    valid: [],
    invalid: [
        {
            code: `<div class="m:10px m:20px m:30px:hover m:40px@dark">Simple</div>`,
            output: `<div class="m:10px m:30px:hover m:40px@dark">Simple</div>`,
            errors: [
                { messageId: 'collisionClass' },
                { messageId: 'collisionClass' }
            ],
            filename: 'test.mdx',
            languageOptions: {
                parser: await import('eslint-mdx')
            }
        },
    ],
})
