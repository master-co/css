import rule from '../../src/rules/class-order'
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

ruleTester.run('svelte class order', rule, {
    valid: [{ code: `<div class="bg:black f:24 fg:white m:8 p:8">Simple, basic</div>` }],
    invalid: [
        {
            code: `<div class="m:8 bg:black p:8 f:24 fg:white {flipped ? 'flipped' : ''}">Enhancing readability</div>`,
            output: `<div class="bg:black f:24 fg:white m:8 p:8 {flipped ? 'flipped' : ''}">Enhancing readability</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            filename: 'test.svelte',
            parser: require.resolve('svelte-eslint-parser'),
        },
    ],
})