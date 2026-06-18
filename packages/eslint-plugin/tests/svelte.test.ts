import rule from '../src/rules/class-order'
import { jsxTester } from './testers'

jsxTester.run('svelte class order', rule, {
    valid: [{ code: `<div class="bg:black fg:white font:24 m:8 p:8">Simple, basic</div>` }],
    invalid: [
        {
            code: `<div class="m:8 bg:black p:8 fg:white font:24">Enhancing readability</div>`,
            output: `<div class="bg:black fg:white font:24 m:8 p:8">Enhancing readability</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            filename: 'test.svelte',
            languageOptions: {
                parser: await import('svelte-eslint-parser')
            }
        },
    ],
})
