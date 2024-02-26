import OrderRule from '../../src/rules/class-order'
import CollisionRule from '../../src/rules/class-collision'
import { RuleTester } from '@typescript-eslint/rule-tester'

const ruleTester = new RuleTester({
    parser: require.resolve('@typescript-eslint/parser'),
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        }
    }
})

ruleTester.run('mdx class order', OrderRule, {
    valid: [{ code: `<div class="bg:black f:24 fg:white m:8 p:8">Simple, basic</div>` }],
    invalid: [
        {
            code: `
            # Test
            <div class="m:8 bg:black p:8 f:24 fg:white">Simple</div>`,
            output: `
            # Test
            <div class="bg:black f:24 fg:white m:8 p:8">Simple</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            filename: 'test.mdx',
            parser: require.resolve('eslint-mdx'),
        },
    ],
})

ruleTester.run('mdx class collision', CollisionRule, {
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
            parser: require.resolve('eslint-mdx'),
        },
    ],
})