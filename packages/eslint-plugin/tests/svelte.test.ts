import rule from '../src/rules/sort-classes'
import { jsxTester } from './testers'

jsxTester.run('svelte sort classes', rule, {
    valid: [{ code: `<div class="m:2x p:2x bg:black fg:white font:1.5rem">Simple, basic</div>` }],
    invalid: [
        {
            code: `<div class="m:2x bg:black p:2x fg:white font:1.5rem">Enhancing readability</div>`,
            output: `<div class="m:2x p:2x bg:black fg:white font:1.5rem">Enhancing readability</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            filename: 'test.svelte',
            languageOptions: {
                parser: await import('svelte-eslint-parser')
            }
        },
    ],
})
