import rule from '../../src/rules/class-order'
import { RuleTester } from 'eslint'

const ruleTester = new RuleTester({
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
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