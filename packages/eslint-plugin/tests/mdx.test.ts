import OrderRule from '../src/rules/class-order'
import CollisionRule from '../src/rules/class-collision'
import { jsxTester } from './testers'

jsxTester.run('mdx class order', OrderRule, {
    valid: [{ code: `<div class="m:8 p:8 bg:black f:24 fg:white">Simple, basic</div>` }],
    invalid: [
        {
            code: `
            # Test
            <div class="m:8 bg:black p:8 f:24 fg:white">Simple</div>`,
            output: `
            # Test
            <div class="m:8 p:8 bg:black f:24 fg:white">Simple</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            filename: 'test.mdx',
            languageOptions: {
                parser: await import('eslint-mdx')
            }
        },
    ],
})

jsxTester.run('mdx class collision', CollisionRule, {
    valid: [],
    invalid: [
        {
            code: `<div class="m:10 m:20 m:30:hover m:40@dark">Simple</div>`,
            output: `<div class="m:10 m:30:hover m:40@dark">Simple</div>`,
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