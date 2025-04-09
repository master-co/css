import rule from '../../src/rules/class-order'
import { RuleTester } from '@typescript-eslint/rule-tester'

const ruleTester = new RuleTester({
    languageOptions: {
        parserOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            ecmaFeatures: {
                jsx: true,
            }
        }
    }
})

ruleTester.run('svelte class order', rule, {
    valid: [{ code: `<div class="m:8 p:8 bg:black f:24 fg:white">Simple, basic</div>` }],
    invalid: [
        {
            code: `<div class="m:8 bg:black p:8 f:24 fg:white">Enhancing readability</div>`,
            output: `<div class="m:8 p:8 bg:black f:24 fg:white">Enhancing readability</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            filename: 'test.svelte',
            languageOptions: {
                parser: await import('svelte-eslint-parser')
            }
        },
    ],
})